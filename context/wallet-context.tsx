'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserWallet } from '@meshsdk/core';
import type { WalletConnection, WalletName } from '@/types/cardano.types';

interface WalletContextValue {
  wallet: WalletConnection | null;
  walletAPI: BrowserWallet | null;
  availableWallets: WalletName[];
  setWallet: (wallet: WalletConnection | null) => void;
  setWalletAPI: (api: BrowserWallet | null) => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletAPI, setWalletAPI] = useState<BrowserWallet | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletName[]>([]);

  // Detect available wallets
  useEffect(() => {
    (async () => {
      try {
        const wallets = await BrowserWallet.getAvailableWallets();
        setAvailableWallets(wallets.map((w) => w.name as WalletName));
      } catch (e) {
        console.error('Failed to detect wallets:', e);
      }
    })();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        walletAPI,
        availableWallets,
        setWallet,
        setWalletAPI,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
};