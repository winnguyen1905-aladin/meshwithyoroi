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
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  const [hasSavedToFile, setHasSavedToFile] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Redirect nếu chưa authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Nếu keys đã được unlock (không cần password nữa), redirect đến job page
  // Nhưng không redirect nếu đang hiển thị mnemonic để user có thể lưu nó
  useEffect(() => {
    if (isInitialized && isAuthenticated && keyExists && !isLocked && !showMnemonic) {
      router.push('/job');
    }
  }, [isInitialized, isAuthenticated, keyExists, isLocked, showMnemonic, router]);

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
        // Set showMnemonic = true trước để tránh useEffect redirect ngay lập tức
        setShowMnemonic(true);
        const result = await createKeys(password);
        if (result.success) {
          setMnemonic(result.mnemonic || null);
          setShowWarningDialog(true);
          // Đợi user xác nhận đã lưu mnemonic trước khi redirect
        } else {
          setError(result.message);
          setShowMnemonic(false); // Reset nếu thất bại
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
    if (!hasSavedToFile) {
      setError('Please confirm that you have saved the mnemonic phrase to a text file');
      return;
    }
    setShowMnemonic(false);
    setHasSavedToFile(false);
    router.push('/job');
  };

  const handleDownloadMnemonic = () => {
    if (!mnemonic) return;
    const blob = new Blob([mnemonic], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mnemonic-backup-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <>
        <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Important Warning</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p className="font-semibold text-destructive">
                  You MUST save your mnemonic phrase to a text file for backup!
                </p>
                <p>
                  This mnemonic phrase is your only way to recover your encryption keys.
                  If you lose it, you will NEVER be able to decrypt your messages.
                </p>
                <p>
                  <strong>Action required:</strong> Download the mnemonic phrase as a text file
                  and store it in a safe location (USB drive, encrypted folder, or physical backup).
                </p>
                <p className="text-xs text-muted-foreground">
                  This is the ONLY time you will see this phrase. Make sure to save it securely before continuing.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  handleDownloadMnemonic();
                  setShowWarningDialog(false);
                }}
              >
                Download as TXT File
              </Button>
              <Button
                onClick={() => setShowWarningDialog(false)}
              >
                I Understand
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>🔑 Save Your Recovery Phrase</CardTitle>
              <CardDescription>
                Please write down this mnemonic phrase and keep it safe. If you lose it, you will never be able to decrypt your messages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  ⚠️ <strong>WARNING:</strong> This is the only time you will see this phrase. You MUST save it to a text file for backup!
                </AlertDescription>
              </Alert>
              <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-primary/20">
                <p className="font-mono text-sm leading-relaxed text-center break-words">
                  {mnemonic}
                </p>
              </div>
              <div className="flex flex-col gap-3">
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
                    variant="outline"
                    onClick={handleDownloadMnemonic}
                    className="flex-1"
                  >
                    Download as TXT File
                  </Button>
                </div>
                <div className="flex items-start space-x-2 p-3 bg-muted rounded-lg border">
                  <Checkbox
                    id="saved-to-file"
                    checked={hasSavedToFile}
                    onCheckedChange={(checked) => {
                      setHasSavedToFile(checked === true);
                      if (checked && error) {
                        setError(null);
                      }
                    }}
                    className="mt-1"
                  />
                  <label
                    htmlFor="saved-to-file"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I confirm that I have saved the mnemonic phrase to a text file and stored it securely
                  </label>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={handleContinueAfterMnemonic}
                  disabled={!hasSavedToFile}
                  className="w-full"
                >
                  I've Saved It, Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
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

