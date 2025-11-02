'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useChatKey } from '@/context/chatkey-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

export default function SetupPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const { keyExists, isLocked, createKeys, unLockKeys, error: keyError } = useChatKey();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  // Redirect nếu chưa authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Nếu keys đã được unlock (không cần password nữa), redirect đến job page
  useEffect(() => {
    if (isInitialized && isAuthenticated && keyExists && !isLocked) {
      router.push('/job');
    }
  }, [isInitialized, isAuthenticated, keyExists, isLocked, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Nếu tạo keys mới, cần confirm password
    if (!keyExists && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (!keyExists) {
        // Tạo keys mới
        const result = await createKeys(password);
        if (result.success) {
          setMnemonic(result.mnemonic || null);
          setShowMnemonic(true);
          // Đợi user xác nhận đã lưu mnemonic trước khi redirect
        } else {
          setError(result.message);
        }
      } else {
        // Unlock keys đã tồn tại
        const result = await unLockKeys(password);
        if (result.success) {
          // Redirect đến job page
          router.push('/job');
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterMnemonic = () => {
    setShowMnemonic(false);
    router.push('/job');
  };

  // Hiển thị loading khi chưa initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // Không hiển thị nếu chưa authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Hiển thị mnemonic nếu vừa tạo keys mới
  if (showMnemonic && mnemonic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>🔑 Save Your Recovery Phrase</CardTitle>
            <CardDescription>
              Please write down this mnemonic phrase and keep it safe. If you lose it, you will never be able to decrypt your messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                ⚠️ This is the only time you will see this phrase. Make sure to save it securely.
              </AlertDescription>
            </Alert>
            <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-primary/20">
              <p className="font-mono text-sm leading-relaxed text-center break-words">
                {mnemonic}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(mnemonic);
                  alert('Mnemonic copied to clipboard!');
                }}
                className="flex-1"
              >
                Copy to Clipboard
              </Button>
              <Button
                onClick={handleContinueAfterMnemonic}
                className="flex-1"
              >
                I've Saved It, Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {keyExists ? '🔓 Unlock Your Keys' : '🔑 Create Your Keys'}
          </CardTitle>
          <CardDescription>
            {keyExists
              ? 'Enter your password to unlock your encryption keys'
              : 'Create a password to secure your encryption keys'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || keyError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error || keyError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password (min 8 characters)"
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            {!keyExists && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  {keyExists ? 'Unlocking...' : 'Creating Keys...'}
                </>
              ) : (
                keyExists ? 'Unlock Keys' : 'Create Keys'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

