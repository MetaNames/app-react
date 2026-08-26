"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Badge } from "@/components/ui/badge";
import { config } from "@/lib/config";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/profile", label: "Profile" },
  { href: "/tld", label: "TLD" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Navigating from inside the mobile menu would otherwise replace the page
  // under a still-open overlay. Adjusting during render (rather than in an
  // effect) closes it before the stale menu is ever painted, and also covers
  // back/forward navigation, which the links' own onClick cannot.
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setMobileMenuOpen(false);
  }

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header className="border-b border-border/60 sticky top-0 z-50 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          {config.isTestnet && (
            <Badge
              variant="outline"
              className="text-[10px] tracking-[0.15em] text-muted-foreground border-border"
            >
              TESTNET
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4">
            {NAV_LINKS.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm transition-colors ${
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <WalletConnectButton />
          <button
            onClick={toggleMobileMenu}
            className="focus-ring p-2 hover:bg-muted rounded-md transition-colors md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
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
            {NAV_LINKS.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm transition-colors py-2 ${
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  onClick={closeMobileMenu}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
