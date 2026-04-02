import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Logo } from "@/components/logo";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { config } from "@/lib/config";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MetaNames – .mpc Domain Name Service",
  description: "Register and manage .mpc domains on Partisia Blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>
          {config.contractDisabled && (
            <Alert className="rounded-none border-x-0 border-t-0 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertDescription className="flex items-center justify-between max-w-5xl mx-auto w-full">
                <span>Contract is temporarily disabled for updates</span>
                <a
                  href="https://t.me/mpc_metanames"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium underline"
                >
                  Check status
                </a>
              </AlertDescription>
            </Alert>
          )}
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
              <nav className="flex items-center gap-4">
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
                <WalletConnectButton />
              </nav>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8 flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}