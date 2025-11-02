'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, loading, isInitialized } = useAuth(); // ✅ Add isInitialized

  useEffect(() => {
    // ✅ Only redirect after initialization is complete
    if (isInitialized && !loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, isInitialized, router]);

  // ✅ Show loading while initializing OR while loading
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // ✅ Only show null after initialization is complete
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}