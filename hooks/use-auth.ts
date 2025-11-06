'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSession, createSession, saveSession, clearSession, isSessionValid } from '@/lib/session';
import { requestChallenge, verifySignature } from '@/app/api/auth/authService';
import { setAccessTokenCookie, getAccessTokenCookie, removeAccessTokenCookie } from '@/utils/cookies';
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
  accessToken: string | null;
  step: 'select' | 'connected' | 'signing' | 'authenticated';
  stakeAddress: string | null;
}

export const useAuth = () => {
  const { wallet, walletAPI, availableWallets, setWallet, setWalletAPI } = useWalletContext();
  const [isInitialized, setIsInitialized] = useState(false); // ✅ Track initialization
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    step: 'select',
    stakeAddress: null,
  });

  // Minimize re-renders: shallow compare before committing state updates
  const setAuth = useCallback((patch: Partial<AuthState>) => {
    setAuthState((prev) => {
      const next: AuthState = { ...prev, ...patch } as AuthState;
      if (
        prev.isAuthenticated === next.isAuthenticated &&
        prev.accessToken === next.accessToken &&
        prev.step === next.step &&
        prev.stakeAddress === next.stakeAddress
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  // Restore session on mount
  useEffect(() => {
    const initAuth = () => {
      const session = getSession();
      const accessToken = getAccessTokenCookie();
      
      if (session && isSessionValid() && accessToken) {
        setAuth({ isAuthenticated: true, accessToken, step: 'authenticated' });
      }
      
      setIsInitialized(true); // ✅ Mark as initialized
    };

    initAuth();
  }, [setAuth]);

  // Hydrate stake address when walletAPI is available but stakeAddress is missing
  useEffect(() => {
    if (!walletAPI || authState.stakeAddress) return;
    (async () => {
      try {
        const rewardAddresses = await walletAPI.getRewardAddresses();
        const stakeAddr = rewardAddresses && rewardAddresses.length > 0 ? rewardAddresses[0] : null;
        if (stakeAddr) {
          setAuth({ stakeAddress: stakeAddr });
        }
      } catch (e) {
        // ignore silently; will be set during connect/authenticate
      }
    })();
  }, [walletAPI, authState.stakeAddress, setAuth]);

  // Auto-reconnect previously connected wallet and hydrate wallet + stakeAddress
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (walletAPI || wallet) return;
    const savedWalletName = localStorage.getItem('connectedWallet') as WalletName | null;
    if (!savedWalletName) return;
    (async () => {
      try {
        const { BrowserWallet } = await import('@meshsdk/core');
        const api = await BrowserWallet.enable(savedWalletName);
        setWalletAPI(api);

        let addresses = await api.getUsedAddresses();
        if (!addresses || addresses.length === 0) {
          const change = await api.getChangeAddress();
          addresses = change ? [change] : [];
        }
        if (addresses.length === 0) return; // cannot hydrate

        const bech32Address = addresses[0];
        const networkId = await api.getNetworkId();
        const lovelace = await api.getLovelace();
        const rewardAddresses = await api.getRewardAddresses();
        const stakeAddr = rewardAddresses && rewardAddresses.length > 0 ? rewardAddresses[0] : null;
        const balanceAda = formatAda(lovelace);

        const connection: WalletConnection = {
          name: savedWalletName,
          address: bech32Address,
          balance: balanceAda,
          networkId,
          isConnected: true,
        };

        setWallet(connection);
        setAuth({ step: 'connected', stakeAddress: stakeAddr });
      } catch (e) {
        // if auto-reconnect fails, clear saved hint
        try { localStorage.removeItem('connectedWallet'); } catch {}
      }
    })();
  }, [walletAPI, wallet, setWalletAPI, setWallet]);

  // Connect wallet
  const connectWallet = useCallback(
    async (walletName: WalletName) => {
      setError(null);
      setLoading(true);

      try {
        // Dynamic import để chỉ load ở client-side
        const { BrowserWallet } = await import('@meshsdk/core');
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
        const rewardAddresses = await api.getRewardAddresses();
        const stakeAddress = rewardAddresses && rewardAddresses.length > 0 ? rewardAddresses[0] : null;
        const balanceAda = formatAda(lovelace);

        const connection: WalletConnection = {
          name: walletName,
          address: bech32Address,
          balance: balanceAda,
          networkId,
          isConnected: true,
        };

        setWallet(connection);
        setAuth({ step: 'connected', stakeAddress });
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

    setError(null);
    setLoading(true);
    setAuth({ step: 'signing' });

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

      const { accessToken } = verifyDataResult.data;

      // Save accessToken to cookie
      setAccessTokenCookie(accessToken);

      const session = createSession(wallet.address, wallet.name);
      saveSession(session);
      setAuth({ isAuthenticated: true, accessToken, step: 'authenticated', stakeAddress });

      return { accessToken, address: wallet.address, walletName: wallet.name };
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setAuth({ isAuthenticated: false, step: 'connected' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAPI, wallet]);

  const disconnectWallet = useCallback(() => {
    setError(null);
    setWallet(null);
    setWalletAPI(null);
    setAuth({ isAuthenticated: false, accessToken: null, step: 'select', stakeAddress: null });
    clearSession();
    removeAccessTokenCookie();
    localStorage.removeItem('connectedWallet');
  }, [setWallet, setWalletAPI]);

  const authReturn = useMemo(() => ({
    wallet,
    availableWallets,
    isAuthenticated: authState.isAuthenticated,
    accessToken: authState.accessToken,
    stakeAddress: authState.stakeAddress,
    authStep: authState.step,
    connectWallet,
    authenticate,
    disconnectWallet,
    loading,
    error,
    isInitialized, // ✅ Export this
  }), [
    wallet,
    availableWallets,
    authState.isAuthenticated,
    authState.accessToken,
    authState.stakeAddress,
    authState.step,
    connectWallet,
    authenticate,
    disconnectWallet,
    loading,
    error,
    isInitialized,
  ]);

  return authReturn;
};