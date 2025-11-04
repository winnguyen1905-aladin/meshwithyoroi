"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { WalletLoginCard } from "@/components/wallet-login-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

import { WalletName } from "@/types/cardano.types";
import { useAuth } from "@/hooks/use-auth";
import { useChatKey } from "@/context/chatkey-context";

export default function LoginPage() {
  const wallet = useAuth();   
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletName | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to setup-password nếu đã authenticated
  useEffect(() => {
    if (mounted && wallet.isAuthenticated) {
      router.push("/setup-password");
    }
  }, [mounted, wallet.isAuthenticated, router]);

  // Derive UI states từ hook để tránh state dư thừa
  const isConnecting = useMemo(
    () => wallet.loading && wallet.authStep === "select" && !!selectedWallet,
    [wallet.loading, wallet.authStep, selectedWallet]
  );
  const isAuthenticating = useMemo(
    () => wallet.authStep === "signing",
    [wallet.authStep]
  );

  const handleWalletConnect = async (walletName: WalletName) => {
    try {
      setSelectedWallet(walletName);
      await wallet.connectWallet(walletName);
      // Sau khi connect xong, bước sẽ chuyển sang 'connected' theo hook
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setSelectedWallet(null);
    }
  };

  const handleAuthenticate = async () => {
    try {
      await wallet.authenticate();
      // Redirect sẽ tự chạy ở useEffect khi isAuthenticated = true
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  const handleDisconnect = () => {
    wallet.disconnectWallet();
    setSelectedWallet(null);
  };

  if (!mounted) return null;

  // Helper: rút gọn địa chỉ
  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-10)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Section - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Cardano Blockchain</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-balance leading-tight">
                Secure Wallet
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Authentication
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Connect your Cardano wallet securely. Manage transactions, escrow contracts, and digital assets with ease.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Multi-Wallet Support</h3>
                  <p className="text-sm text-muted-foreground">Connect via Lace, Yoroi, or Eternl</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Bank-Level Security</h3>
                  <p className="text-sm text-muted-foreground">Your keys, your security</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Instant Transactions</h3>
                  <p className="text-sm text-muted-foreground">Fast and reliable blockchain operations</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              By connecting your wallet, you agree to our{" "}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Right Section - Auth Flow */}
          <div className="space-y-6">
            {/* Error */}
            {wallet.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <span className="flex items-center gap-2">
                    <span>❌</span>
                    {wallet.error}
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Select */}
            {wallet.authStep === "select" && (
              <>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
                  <p className="text-muted-foreground">Choose your preferred Cardano wallet to get started</p>
                </div>

                <div className="space-y-3">
                  {wallet.availableWallets.map((walletName) => (
                    <WalletLoginCard
                      key={walletName}
                      walletName={walletName}
                      isSelected={selectedWallet === walletName}
                      isLoading={isConnecting && selectedWallet === walletName}
                      onConnect={() => handleWalletConnect(walletName)}
                    />
                  ))}
                </div>

                {wallet.availableWallets.length === 0 && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground">
                      No Cardano wallets detected. Please install Lace, Yoroi, or Eternl browser extension.
                    </p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 text-base bg-transparent"
                  onClick={() => router.push("/dashboard")}
                >
                  Continue as Demo User
                </Button>
              </>
            )}

            {/* Step 2: Connected */}
            {wallet.authStep === "connected" && wallet.wallet && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Wallet Connected</h2>
                    <p className="text-muted-foreground">Ready to authenticate</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Wallet:</span>
                    <span className="text-sm font-mono">{wallet.wallet.name.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Address:</span>
                    <span className="text-sm font-mono">{truncateAddress(wallet.wallet.address)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Balance:</span>
                    <span className="text-sm font-mono">{wallet.wallet.balance} ADA</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleAuthenticate}
                    disabled={isAuthenticating}
                    className="w-full h-12 text-base"
                  >
                    {isAuthenticating ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Authenticating...
                      </>
                    ) : (
                      <>🔑 Sign & Authenticate</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleDisconnect} className="w-full h-12 text-base">
                    ← Back to Wallet Selection
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Signing */}
            {wallet.authStep === "signing" && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                  <Spinner className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Signing Message</h2>
                  <p className="text-muted-foreground">
                    Please check your {wallet.wallet?.name} wallet to sign the authentication message
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Authenticated */}
            {wallet.authStep === "authenticated" && wallet.wallet && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Authentication Successful!</h2>
                  {wallet.wallet?.address && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      ✨ New Account Created
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">User ID:</span>
                    <span className="text-sm font-mono">{truncateAddress(wallet.wallet.address)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Wallet:</span>
                    <span className="text-sm font-mono">
                      {truncateAddress(wallet.wallet?.address || "")}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
