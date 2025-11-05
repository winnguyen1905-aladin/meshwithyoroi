'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/utils';

export function AppHeader() {
  const { isAuthenticated, isInitialized, wallet } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/introduction', label: 'Introduction' },
    { href: '/job', label: 'Jobs' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 h-[72px] min-h-[72px] max-h-[72px] will-change-transform">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between relative h-full">
          {/* Logo - Left */}
          <Link href="/" className="font-bold text-lg text-primary hover:opacity-80 transition-opacity flex-shrink-0 whitespace-nowrap min-w-[140px]">
            Aladin Contract
          </Link>

          {/* Navigation Menu - Center */}
          <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group text-base font-semibold relative px-4 py-2.5 rounded-lg transition-all duration-300 ease-in-out',
                  'hover:scale-105 hover:bg-accent/50 active:scale-95',
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="relative z-10">{link.label}</span>
                {/* Active underline */}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
                {/* Hover underline animation - chỉ hiện khi không active */}
                {!isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/40 rounded-full scale-x-0 origin-center transition-transform duration-300 ease-in-out group-hover:scale-x-100" />
                )}
              </Link>
            ))}
          </nav>

          {/* Auth Section - Right */}
          <div className="flex items-center gap-4 flex-shrink-0 ml-auto min-w-[120px]">
            {isInitialized && (
              <>
                {isAuthenticated ? (
                  <>
                    {wallet?.address && (
                      <span className="hidden sm:inline-block text-xs text-muted-foreground font-mono px-2 py-1 bg-muted rounded whitespace-nowrap">
                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      Login
                    </Link>
                    <Link
                      href="/login"
                      className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

