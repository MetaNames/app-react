import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { config } from "@/lib/config";

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
      <body>
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
          <Header />
          <main className="container mx-auto px-4 py-0 flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}