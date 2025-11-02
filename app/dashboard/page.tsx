'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWalletData } from '@/hooks/use-wallet-data';
import { useTransactions } from '@/hooks/use-transactions';

export default function Dashboard() {
  const {
    wallet,
    availableWallets,
    isAuthenticated,
    authStep,
    connectWallet,
    authenticate,
    disconnectWallet,
    loading: authLoading,
  } = useAuth();

  const {
    balance,
    utxos,
    assets,
    fetchBalance,
    fetchUtxos,
    refreshAll,
    loading: dataLoading,
  } = useWalletData();

  const {
    signTransaction,
    submitTransaction,
    signAndSubmit,
    loading: txLoading,
  } = useTransactions();

  // Auto-fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && wallet) {
      refreshAll();
    }
  }, [isAuthenticated, wallet]);

  // Connect wallet handler
  const handleConnect = async (walletName: string) => {
    try {
      await connectWallet(walletName as any);
      // After connecting, authenticate
      await authenticate();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  // Send transaction example
  const handleSendAda = async () => {
    try {
      const txHex = '...'; // Build your transaction
      const txHash = await signAndSubmit(txHex);
      console.log('Transaction submitted:', txHash);
      
      // Refresh balance after transaction
      await refreshAll();
    } catch (err) {
      console.error('Transaction failed:', err);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>

      {!wallet ? (
        <div>
          <h2>Connect Wallet</h2>
          {availableWallets.map((name) => (
            <button key={name} onClick={() => handleConnect(name)}>
              Connect {name}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <h2>Wallet: {wallet.name}</h2>
          <p>Address: {wallet.address}</p>
          <p>Balance: {balance} ADA</p>
          <p>UTXOs: {utxos.length}</p>
          <p>Assets: {assets.length}</p>
          
          <button onClick={refreshAll} disabled={dataLoading}>
            Refresh Data
          </button>
          
          <button onClick={handleSendAda} disabled={txLoading}>
            Send ADA
          </button>
          
          <button onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}