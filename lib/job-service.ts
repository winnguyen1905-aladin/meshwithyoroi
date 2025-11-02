/**
 * Job funding service functions - Pure business logic (no React hooks)
 */

import { myPaymentKeyHashHex, pkhFromPaymentAddress } from '@/lib/cardano-utils';
import { buildEscrowMetadata } from '@/lib/job-utils';
import { fundEscrow, getDefaultChangeAddress, type EscrowFundParams } from '@/lib/escrow-service';
import type { EscrowFundResult } from '@/lib/escrow-service';

export interface JobFundParams {
  jobId: string;
  jobIdHex: string;
  scriptAddress: string;
  geniePaymentAddress: string;
  amountLovelace: string;
  jobTitle?: string;
  walletAPI: any;                   // Wallet API instance
  changeAddress?: string;           // Optional change address
}


/**
 * Main service function to fund job escrow
 * Pure function - no React dependencies
 */
export async function fundJobEscrow(params: JobFundParams): Promise<EscrowFundResult> {
  if (!params.walletAPI) {
    throw new Error('Wallet not connected');
  }

  // Validate required parameters
  if (!params.jobId || !params.geniePaymentAddress) {
    throw new Error('Missing required parameters: jobId and geniePaymentAddress');
  }

  // Get change address
  const changeAddress = params.changeAddress ?? await getDefaultChangeAddress(params.walletAPI);

  // Lấy PKH của Aladin (current wallet) & Genie (từ payment address)
  const aladinPKH = await myPaymentKeyHashHex(params.walletAPI);
  const geniePKH = pkhFromPaymentAddress(params.geniePaymentAddress);

  // Build metadata
  const metadata = buildEscrowMetadata({
    jobId: params.jobId,
    jobIdHex: params.jobIdHex,
    amountLovelace: params.amountLovelace,
    jobTitle: params.jobTitle,
  });

  // Prepare fund parameters
  const fundParams: EscrowFundParams = {
    scriptAddress: params.scriptAddress,
    aladinKeyHashHex: aladinPKH,
    genieKeyHashHex: geniePKH,
    stateCtorIndex: 0, // ví dụ Init = 0
    paymentAmountLovelace: params.amountLovelace,
    jobIdHex: params.jobIdHex,
    metadataLabel: '674', // CIP-20
    metadata,
    changeAddress,
    walletAPI: params.walletAPI,
  };

  return await fundEscrow(fundParams);
}

