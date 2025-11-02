'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WalletConnection, WalletName } from '@/types/cardano.types';

// Dynamic import để tránh server-side compilation
type BrowserWalletType = typeof import('@meshsdk/core')['BrowserWallet'];

interface WalletContextValue {
  wallet: WalletConnection | null;
  walletAPI: any | null; // BrowserWallet instance
  availableWallets: WalletName[];
  setWallet: (wallet: WalletConnection | null) => void;
  setWalletAPI: (api: any | null) => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletAPI, setWalletAPI] = useState<any | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletName[]>([]);

  // Detect available wallets - chỉ chạy ở client-side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    (async () => {
      try {
        // Dynamic import để chỉ load ở client-side
        const { BrowserWallet } = await import('@meshsdk/core');
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