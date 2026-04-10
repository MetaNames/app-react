"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Badge } from "@/components/ui/badge";
import { config } from "@/lib/config";
import { Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          {config.isTestnet && (
            <Badge variant="secondary" className="text-xs">
              TESTNET
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/profile"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/tld"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              TLD
            </Link>
          </nav>
          <WalletConnectButton />
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-muted rounded-md transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link
              href="/profile"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Profile
            </Link>
            <Link
              href="/tld"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={closeMobileMenu}
            >
              TLD
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
