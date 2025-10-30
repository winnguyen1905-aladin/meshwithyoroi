import { useState, useEffect, useCallback } from "react";
import { BrowserWallet, Wallet } from "@meshsdk/core";
import { getSession, createSession, saveSession, clearSession, isSessionValid } from "@/lib/session";
import { WalletConnection, WalletName } from "@/lib/cardano-types";
import { AuthState } from "./use-auth";

interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
interface ChallengeData {
  message: string;
  nonce: string;
  externalAad?: string;
}
interface VerifyData {
  accessToken: string;
  user: {
    id: string;
    newAccount: boolean;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// Helper: format số lovelace (Mesh trả về string thập phân) -> ADA string
const formatAda = (lovelace: string) => {
  try {
    const ada = Number(BigInt(lovelace)) / 1_000_000;
    return ada.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return "0";
  }
};

export const useMesh = () => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletAPI, setWalletAPI] = useState<BrowserWallet | null>(null); // Mesh Wallet instance
  const [availableWallets, setAvailableWallets] = useState<WalletName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    address: null,
    walletName: null,
    isLoading: false,
  });

  // Detect wallets (Mesh): BrowserWallet.getAvailableWallets()
  useEffect(() => {
    (async () => {
      try {
        const wallets = await BrowserWallet.getAvailableWallets();
        setAvailableWallets(wallets.map((w) => w.name as WalletName));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Check existing session
  useEffect(() => {
    const session = getSession();
    if (session && isSessionValid()) {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: true,
        address: session.address,
        walletName: session.walletName,
        isLoading: false,
      }));
    }
  }, []);

  const connectWallet = useCallback(async (walletName: WalletName) => {
    setError(null);
    setLoading(true);
    try {
      // Mesh enable
      const api = await BrowserWallet.enable(walletName);
      setWalletAPI(api);

      // Lấy địa chỉ ví (bech32). Mesh trả về bech32 trực tiếp.
      let addresses = await api.getUsedAddresses();
      if (!addresses || addresses.length === 0) {
        const change = await api.getChangeAddress();
        addresses = change ? [change] : [];
      }
      if (addresses.length === 0) {
        throw new Error("No address found in wallet");
      }
      const bech32Address = addresses[0];

      // Network + số dư
      const networkId = await api.getNetworkId();
      const lovelace = await api.getLovelace(); // string decimal
      const balanceAda = formatAda(lovelace);

      const connection: WalletConnection = {
        name: walletName,
        address: bech32Address,
        balance: balanceAda,
        networkId,
        isConnected: true,
      };

      setWallet(connection);
      setAuthState((prev) => ({ ...prev, isAuthenticated: true, address: bech32Address, walletName: walletName, isLoading: false }));
      localStorage.setItem("connectedWallet", walletName);
      return connection;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const authenticate = useCallback(async () => {
    if (!walletAPI || !wallet?.address) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);
    setAuthState((prev) => ({ ...prev, isAuthenticated: true, address: wallet.address, walletName: wallet.name, isLoading: true }));

    try {
      // 1) Lấy challenge từ backend
      const challengeRes = await fetch(`${API_BASE_URL}/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: wallet.address,
          walletType: wallet.name.toUpperCase(),
        }),
      });
      if (!challengeRes.ok) throw new Error("Failed to get challenge from server");

      const challengeData: BackendResponse<ChallengeData> = await challengeRes.json();
      const { message, nonce, externalAad } = challengeData.data;

      // 2) Lấy stake/reward address (bech32) từ Mesh
      const rewardAddresses = await walletAPI.getRewardAddresses();
      if (!rewardAddresses || rewardAddresses.length === 0) {
        throw new Error("No reward address found in wallet");
      }
      const stakeAddr = rewardAddresses[0]; // bech32 "stake1..."

      // 3) Ký message (CIP-8 via Mesh). Mesh tự xử lý bytes/hex.
      // Bạn có thể ký 'message' (thường chứa nonce). Nếu backend yêu cầu ký đúng "message", cứ dùng "message".
      const signResult = await walletAPI.signData(stakeAddr, message);

      // 4) Verify với backend
      const verifyPayload = {
        walletAddress: wallet.address,
        nonce,
        coseSign1: signResult.signature,
        externalAad: externalAad || "",
        publicKey: signResult.key,
        walletType: wallet.name.toUpperCase(),
      };

      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyPayload),
      });
      if (!verifyRes.ok) {
        const errorData = await verifyRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Verification failed");
      }

      const verifyData: BackendResponse<VerifyData> = await verifyRes.json();
      const { accessToken, user: userData } = verifyData.data;

      // 5) Save session
      const session = createSession(wallet.address, wallet.name);
      saveSession(session);

      // 6) Update state
      setAuthState({
        isAuthenticated: true,
        address: wallet.address,
        walletName: wallet.name,
        isLoading: false,
      });

      return { accessToken, address: wallet.address, walletName: wallet.name };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setAuthState((prev) => ({ ...prev, isAuthenticated: false, address: null, walletName: null, isLoading: false }));
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
      address: null,
      walletName: null,
      isLoading: false,
    });
    clearSession();
    localStorage.removeItem("connectedWallet");
  }, []);

  const getBalance = useCallback(async () => {
    if (!walletAPI) throw new Error("Wallet not connected");
    const lovelace = await walletAPI.getLovelace();
    return formatAda(lovelace);
  }, [walletAPI]);

  const signTransaction = useCallback(
    async (txCborHex: string) => {
      if (!walletAPI) throw new Error("Wallet not connected");
      // Mesh giữ nguyên interface CIP-30: signTx(tx, partialSign?)
      return await walletAPI.signTx(txCborHex);
    },
    [walletAPI]
  );

  const submitTransaction = useCallback(
    async (signedTxCborHex: string) => {
      if (!walletAPI) throw new Error("Wallet not connected");
      return await walletAPI.submitTx(signedTxCborHex);
    },
    [walletAPI]
  );

  return {
    wallet,
    walletAPI,            // Mesh BrowserWallet instance
    availableWallets,     // WalletName[]
    loading,
    error,
    connectWallet,
    disconnectWallet,
    authenticate,
    getBalance,
    signTransaction,
    submitTransaction,
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    address: authState.address,
    walletName: authState.walletName,
    isLoading: authState.isLoading,
  };
};