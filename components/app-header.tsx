'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export function AppHeader() {
  const { isAuthenticated, isInitialized } = useAuth();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-primary">
          Aladin Contract
        </Link>
        <nav className="flex items-center gap-4">
          {isInitialized && !isAuthenticated && (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

