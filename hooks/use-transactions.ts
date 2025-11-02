'use client';

import { useState, useCallback } from 'react';
import { useWalletContext } from '@/context/wallet-context';

export const useTransactions = () => {
  const { walletAPI } = useWalletContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign transaction
  const signTransaction = useCallback(
    async (txCborHex: string) => {
      if (!walletAPI) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        const signedTx = await walletAPI.signTx(txCborHex);
        return signedTx;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign transaction';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [walletAPI]
  );

  // Submit transaction
  const submitTransaction = useCallback(
    async (signedTxCborHex: string) => {
      if (!walletAPI) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        const txHash = await walletAPI.submitTx(signedTxCborHex);
        return txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit transaction';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [walletAPI]
  );

  // Sign and submit in one go
  const signAndSubmit = useCallback(
    async (txCborHex: string) => {
      const signedTx = await signTransaction(txCborHex);
      const txHash = await submitTransaction(signedTx);
      return txHash;
    },
    [signTransaction, submitTransaction]
  );

  return {
    signTransaction,
    submitTransaction,
    signAndSubmit,
    loading,
    error,
  };
};