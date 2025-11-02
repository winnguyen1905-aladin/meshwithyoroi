'use client';

import { useState, useCallback } from 'react';
import { useWalletContext } from '@/context/wallet-context';
import { fundJobEscrow, type JobFundParams as JobFundServiceParams } from '@/lib/job-service';
import type { EscrowFundResult } from '@/lib/escrow-service';

export interface JobFundParams {
  jobId: string;
  jobIdHex: string;
  scriptAddress: string;
  geniePaymentAddress: string;
  amountLovelace: string;
  jobTitle?: string;
}

/**
 * HIGH-LEVEL Hook for job-specific escrow funding
 * 
 * Use this when:
 * - Funding escrow for a job (has job metadata, CIP-20)
 * - You have raw addresses (not yet converted to key hashes)
 * - Want simple API, auto-converts addresses → key hashes
 * 
 * This hook automatically:
 * - Converts addresses to key hashes
 * - Builds job-specific metadata
 * - Handles CIP-20 metadata formatting
 * 
 * For generic escrow (non-job), use `useEscrowFund` instead.
 * 
 * @example
 * ```typescript
 * const { fundEscrow } = useJobFund();
 * await fundEscrow({
 *   jobId: "550e8400-e29b-41d4-a716-446655440001",
 *   jobIdHex: uuidToHex(jobId),
 *   geniePaymentAddress: "addr_xxx",  // Auto-converts to key hash
 *   scriptAddress: "addr_yyy",
 *   amountLovelace: "100000000",
 *   jobTitle: "Website Development",
 * });
 * ```
 */
export function useJobFund() {
  const { walletAPI } = useWalletContext();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fundEscrow = useCallback(
    async (params: JobFundParams): Promise<EscrowFundResult> => {
      if (!walletAPI) {
        throw new Error('Wallet not connected');
      }

      setTxHash(null);
      setLoading(true);
      setError(null);

      try {
        const serviceParams: JobFundServiceParams = {
          ...params,
          walletAPI,
        };

        const result = await fundJobEscrow(serviceParams);
        setTxHash(result.txHash);
        return result;
      } catch (e: any) {
        const msg = e?.message ?? 'Fund escrow failed';
        setError(msg);
        console.error('Fund escrow error:', e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [walletAPI]
  );

  return {
    fundEscrow,
    txHash,
    loading,
    error,
  };
}

