'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJobFund } from '@/hooks/use-job-fund';
import { getEscrowAddressFromPlutusJson } from '@/lib/getEscrowAddressFromPlutusJson';
import { uuidToHex } from '@/lib/job-utils';

function JobPageContent() {
  const searchParams = useSearchParams();
  const { fundEscrow, txHash, loading, error } = useJobFund();

  // Get params from URL search params
  const jobId = searchParams.get('jobId') || '';
  const scriptAddress = searchParams.get('scriptAddress') || getEscrowAddressFromPlutusJson().address;
  const geniePaymentAddress = searchParams.get('geniePaymentAddress') || '';
  const amountLovelace = searchParams.get('amountLovelace') || '100000000';
  const jobTitle = searchParams.get('jobTitle') || undefined;

  const jobIdHex = useMemo(() => {
    if (!jobId) return '';
    try {
      return uuidToHex(jobId);
    } catch (e) {
      console.error('Failed to convert jobId to hex:', e);
      return '';
    }
  }, [jobId]);

  const handleFund = async () => {
    try {
      await fundEscrow({
        jobId,
        jobIdHex,
        scriptAddress,
        geniePaymentAddress,
        amountLovelace,
        jobTitle,
      });
    } catch (e) {
      // Error is handled by the hook
      console.error('Fund escrow failed:', e);
    }
  };

  // Show error if required params are missing
  if (!jobId || !geniePaymentAddress) {
    return (
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-semibold text-red-600">Missing Required Parameters</h1>
        <p className="text-sm text-gray-600">
          Please provide jobId and geniePaymentAddress as URL parameters.
          <br />
          Example: /job?jobId=550e8400-e29b-41d4-a716-446655440001&geniePaymentAddress=addr_xxx&amountLovelace=100000000
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <h1 className="text-xl font-semibold">{jobTitle ?? 'Job'}</h1>

      <div className="text-sm text-gray-600">
        <div><b>Job ID:</b> {jobId}</div>
        <div><b>Script:</b> {scriptAddress.slice(0, 32)}…</div>
        <div><b>Genie:</b> {geniePaymentAddress.slice(0, 32)}…</div>
        <div><b>Amount:</b> {Number(amountLovelace) / 1_000_000} ADA</div>
      </div>

      <button
        onClick={handleFund}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
      >
        {loading ? 'Funding…' : 'Fund Escrow'}
      </button>

      {txHash && (
        <div className="text-green-700 break-all">
          Funded! TxHash: {txHash}
        </div>
      )}
      {error && (
        <div className="text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

// Main page component with Suspense for search params
export default function JobPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <JobPageContent />
    </Suspense>
  );
}
