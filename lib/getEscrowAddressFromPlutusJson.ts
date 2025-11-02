'use client';

import * as CSL from '@emurgo/cardano-serialization-lib-browser';
import plutusJson from '../contract/plutus.json';

export function getEscrowAddressFromPlutusJson(
  title = 'escrow.escrow.spend',
  network: 'preprod' | 'mainnet' = 'preprod',
) {
  const v = plutusJson.validators.find((x: any) => x.title === title);
  if (!v) throw new Error(`Validator "${title}" not found in plutus.json`);

  const compiledHex: string = v.compiledCode;        // UPLC CBOR hex của Aiken
  // Check plutusVersion from preamble (shared across all validators)
  const isV3 = (plutusJson.preamble?.plutusVersion ?? '').toLowerCase().includes('v3');

  // 1) Tạo PlutusScript theo version
  const script =
    isV3
      ? CSL.PlutusScript.from_bytes(Buffer.from(compiledHex, 'hex'))
      : CSL.PlutusScript.from_bytes(Buffer.from(compiledHex, 'hex'));

  // 2) Hash script - Use the script's hash() method
  const scriptHash = script.hash();

  // 3) Tạo enterprise script address từ payment script hash
  const cred = CSL.Credential.from_scripthash(scriptHash);
  // Network ID: 0 = testnet (preprod), 1 = mainnet
  const networkId = network === 'mainnet' ? 1 : 0;

  const addr = CSL.EnterpriseAddress.new(networkId, cred).to_address().to_bech32();
  return { address: addr, scriptHash: Buffer.from(scriptHash.to_bytes()).toString('hex') };
}
