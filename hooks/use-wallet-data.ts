'use client';

import { useState, useCallback } from 'react';
import { useWalletContext } from '@/context/wallet-context';

// Helper: Lovelace -> ADA
const formatAda = (lovelace: string) => {
  try {
    const ada = Number(BigInt(lovelace)) / 1_000_000;
    return ada.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return '0';
  }
};

export const useWalletData = () => {
  const { wallet, walletAPI } = useWalletContext();
  const [balance, setBalance] = useState<string>('0');
  const [utxos, setUtxos] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get balance from wallet
  const fetchBalance = useCallback(async () => {
    if (!walletAPI) {
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const lovelace = await walletAPI.getLovelace();
      const adaBalance = formatAda(lovelace);
      setBalance(adaBalance);
      return adaBalance;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAPI]);

  // Get UTXOs from wallet
  const fetchUtxos = useCallback(async () => {
    if (!walletAPI) {
      setError('Wallet not connected');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const walletUtxos = await walletAPI.getUtxos();
      setUtxos(walletUtxos);
      return walletUtxos;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch UTXOs';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAPI]);

  // Get assets/tokens from wallet
  const fetchAssets = useCallback(async () => {
    if (!walletAPI) {
      setError('Wallet not connected');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const walletAssets = await walletAPI.getAssets();
      setAssets(walletAssets);
      return walletAssets;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assets';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAPI]);

  // Refresh all wallet data
  const refreshAll = useCallback(async () => {
    if (!walletAPI) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [lovelace, walletUtxos, walletAssets] = await Promise.all([
        walletAPI.getLovelace(),
        walletAPI.getUtxos(),
        walletAPI.getAssets(),
      ]);

      setBalance(formatAda(lovelace));
      setUtxos(walletUtxos);
      setAssets(walletAssets);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh wallet data';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAPI]);

  return {
    // Data
    balance,
    utxos,
    assets,
    wallet,

    // Actions
    fetchBalance,
    fetchUtxos,
    fetchAssets,
    refreshAll,

    // State
    loading,
    error,
  };
};