'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrowserWallet } from '@meshsdk/core';
import { getSession, createSession, saveSession, clearSession, isSessionValid } from '@/lib/session';
import { requestChallenge, verifySignature } from '@/app/api/auth/authService';
import type { WalletName, WalletConnection } from '@/types/cardano.types';
import { useWalletContext } from '@/context/wallet-context';

const formatAda = (lovelace: string) => {
  try {
    const ada = Number(BigInt(lovelace)) / 1_000_000;
    return ada.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return '0';
  }
};

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; newAccount: boolean } | null;
  accessToken: string | null;
  step: 'select' | 'connected' | 'signing' | 'authenticated';
}

export const useAuth = () => {
  const { wallet, walletAPI, availableWallets, setWallet, setWalletAPI } = useWalletContext();
  const [isInitialized, setIsInitialized] = useState(false); // ✅ Track initialization
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    step: 'select',
  });

  // Restore session on mount
  useEffect(() => {
    const initAuth = () => {
      const session = getSession();
      
      if (session && isSessionValid()) {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: true,
          step: 'authenticated',
        }));
      }
      
      setIsInitialized(true); // ✅ Mark as initialized
    };

    initAuth();
  }, []);

  // Connect wallet
  const connectWallet = useCallback(
    async (walletName: WalletName) => {
      setError(null);
      setLoading(true);

      try {
        const api = await BrowserWallet.enable(walletName);
        setWalletAPI(api);

        let addresses = await api.getUsedAddresses();
        if (!addresses || addresses.length === 0) {
          const change = await api.getChangeAddress();
          addresses = change ? [change] : [];
        }
        if (addresses.length === 0) {
          throw new Error('No address found in wallet');
        }
        const bech32Address = addresses[0];

        const networkId = await api.getNetworkId();
        const lovelace = await api.getLovelace();
        const balanceAda = formatAda(lovelace);

        const connection: WalletConnection = {
          name: walletName,
          address: bech32Address,
          balance: balanceAda,
          networkId,
          isConnected: true,
        };

        setWallet(connection);
        setAuthState((prev) => ({ ...prev, step: 'connected' }));
        localStorage.setItem('connectedWallet', walletName);

        return connection;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to connect wallet';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setWallet, setWalletAPI]
  );

  const authenticate = useCallback(async () => {
    if (!walletAPI || !wallet?.address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    setAuthState((prev) => ({ ...prev, step: 'signing' }));

    try {
      const challengeResult = await requestChallenge(wallet.address, wallet.name);
      const { message, nonce, externalAad } = challengeResult.data;

      const rewardAddresses = await walletAPI.getRewardAddresses();
      if (!rewardAddresses || rewardAddresses.length === 0) {
        throw new Error('No reward address found in wallet');
      }

      const stakeAddress = rewardAddresses[0];
      const signResult = await walletAPI.signData(message, stakeAddress);

      const verifyDataResult = await verifySignature({
        walletAddress: wallet.address,
        nonce,
        coseSign1: signResult.signature,
        externalAad: externalAad || '',
        publicKey: signResult.key,
        walletType: wallet.name.toUpperCase(),
      });

      const { accessToken, user } = verifyDataResult.data;

      const session = createSession(wallet.address, wallet.name);
      saveSession(session);

      setAuthState({
        isAuthenticated: true,
        user: user ?? { id: wallet.address, newAccount: false },
        accessToken,
        step: 'authenticated',
      });

      return { accessToken, address: wallet.address, walletName: wallet.name };
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        step: 'connected',
      }));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAPI, wallet]);

  const disconnectWallet = useCallback(() => {
    setError(null);
    setWallet(null);
    setWalletAPI(null);
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      step: 'select',
    });
    clearSession();
    localStorage.removeItem('connectedWallet');
  }, [setWallet, setWalletAPI]);

  return {
    wallet,
    availableWallets,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    accessToken: authState.accessToken,
    authStep: authState.step,
    connectWallet,
    authenticate,
    disconnectWallet,
    loading,
    error,
    isInitialized, // ✅ Export this
  };
};