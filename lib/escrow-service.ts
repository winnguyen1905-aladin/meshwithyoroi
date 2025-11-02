/**
 * Escrow service functions - Pure business logic (no React hooks)
 */

import { BrowserWallet, Transaction } from '@meshsdk/core';
import * as CSL from '@emurgo/cardano-serialization-lib-browser';
import { CardanoAPI } from '@/types/cardano.types';

export type EscrowFundParams = {
  scriptAddress: string;            // địa chỉ contract (đúng mạng)
  aladinKeyHashHex: string;         // 28-byte hex (VerificationKeyHash)
  genieKeyHashHex: string;          // 28-byte hex
  stateCtorIndex: number;           // ví dụ: 0=Init, 1=Funded, 2=Complete...
  paymentAmountLovelace: string;    // "100000000"
  jobIdHex: string;                 // bytearray hex (vd uuid không gạch -> hex)
  metadataLabel?: string;           // ví dụ "674" (CIP-20)
  metadata?: Record<string, any>;   // object sẽ encode vào metadata
  changeAddress: string;            // required - change address
  walletAPI: any;                   // Wallet API instance
};

export type EscrowFundResult = {
  txHash: string;
  unsignedTx: string;
  signedTx: string;
};

/**
 * Get default change address from wallet
 */
export async function getDefaultChangeAddress(walletAPI: BrowserWallet): Promise<string> {
  const address = await walletAPI.getChangeAddress();
  if (!address) throw new Error('No change address available');
  return address;
}

/**
 * Build datum hex from escrow parameters
 */
export function buildEscrowDatumHex(params: EscrowFundParams): string {
  const aladin = CSL.PlutusData.new_bytes(Buffer.from(params.aladinKeyHashHex, 'hex'));
  const genie = CSL.PlutusData.new_bytes(Buffer.from(params.genieKeyHashHex, 'hex'));

  // state là enum -> Constr index params.stateCtorIndex, không field
  const state = CSL.PlutusData.new_constr_plutus_data(
    CSL.ConstrPlutusData.new(CSL.BigNum.from_str(params.stateCtorIndex.toString()), CSL.PlutusList.new())
  );

  const amount = CSL.PlutusData.new_integer(CSL.BigInt.from_str(params.paymentAmountLovelace));
  const jobId = CSL.PlutusData.new_bytes(Buffer.from(params.jobIdHex, 'hex'));

  const fields = CSL.PlutusList.new();
  fields.add(aladin);
  fields.add(genie);
  fields.add(state);
  fields.add(amount);
  fields.add(jobId);

  const datumConstr = CSL.ConstrPlutusData.new(CSL.BigNum.from_str('0'), fields); // record -> Constr 0
  return Buffer.from(CSL.PlutusData.new_constr_plutus_data(datumConstr).to_bytes()).toString('hex');
}

/**
 * Convert JSON to TransactionMetadatum (for CIP-20)
 */
function jsonToMetadatum(obj: any): CSL.TransactionMetadatum {
  if (obj === null || obj === undefined) return CSL.TransactionMetadatum.new_text('null');
  if (typeof obj === 'string') return CSL.TransactionMetadatum.new_text(obj);
  if (typeof obj === 'number') return CSL.TransactionMetadatum.new_int(CSL.Int.new_i32(obj));
  if (typeof obj === 'bigint') return CSL.TransactionMetadatum.new_int(CSL.Int.new(obj as any));
  if (typeof obj === 'boolean') return CSL.TransactionMetadatum.new_text(obj ? 'true' : 'false');
  if (Array.isArray(obj)) {
    const list = CSL.MetadataList.new();
    for (const v of obj) list.add(jsonToMetadatum(v));
    return CSL.TransactionMetadatum.new_list(list);
  }
  const map = CSL.MetadataMap.new();
  for (const [k, v] of Object.entries(obj)) {
    map.insert(CSL.TransactionMetadatum.new_text(k), jsonToMetadatum(v));
  }
  return CSL.TransactionMetadatum.new_map(map);
}

/**
 * Attach metadata to unsigned transaction
 */
export function attachMetadataToTransaction(
  unsignedHex: string,
  label: string,
  metaObj: Record<string, any>
): string {
  const tx = CSL.Transaction.from_bytes(Buffer.from(unsignedHex, 'hex'));
  const body = tx.body();

  const gmeta = CSL.GeneralTransactionMetadata.new();
  gmeta.insert(CSL.BigNum.from_str(label), jsonToMetadatum(metaObj));

  const aux = CSL.AuxiliaryData.new();
  aux.set_metadata(gmeta);

  const cleanWits = CSL.TransactionWitnessSet.new(); // vẫn unsigned
  const rebuilt = CSL.Transaction.new(body, cleanWits, aux);
  return Buffer.from(rebuilt.to_bytes()).toString('hex');
}

/**
 * Main service function to fund escrow
 * Pure function - no React dependencies
 */
export async function fundEscrow(params: EscrowFundParams): Promise<EscrowFundResult> {
  if (!params.walletAPI) {
    throw new Error('Wallet not connected');
  }

  const datumHex = buildEscrowDatumHex(params);

  // 1) Build tx: gửi ADA vào script + inline datum
  const tx = new Transaction({ initiator: params.walletAPI });
  tx.sendLovelace(
    { address: params.scriptAddress, datum: { value: datumHex, inline: true } },
    params.paymentAmountLovelace
  );
  tx.setChangeAddress(params.changeAddress);

  let unsignedHex = await tx.build(); // unsigned (chưa witness)

  // 2) (Tuỳ chọn) attach CIP-20 metadata (label 674)
  if (params.metadata && params.metadataLabel) {
    unsignedHex = attachMetadataToTransaction(unsignedHex, params.metadataLabel, params.metadata);
  }

  // 3) Full sign (1 chữ ký) và submit
  const signedHex = await params.walletAPI.signTx(unsignedHex, false);
  const txHash = await params.walletAPI.submitTx(signedHex);

  return { txHash, unsignedTx: unsignedHex, signedTx: signedHex };
}

