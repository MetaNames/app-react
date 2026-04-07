"use client";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { metaNamesSdkFactory } from "@/lib/sdk";

function SdkInitializer() {
  const { metaNamesSdk, setMetaNamesSdk } = useSdkStore();
  useEffect(() => {
    if (!metaNamesSdk) setMetaNamesSdk(metaNamesSdkFactory());
  }, []);
  return null;
}

function AlertWatcher() {
  const alertMessage = useWalletStore((s) => s.alertMessage);
  const setAlertMessage = useWalletStore((s) => s.setAlertMessage);

  useEffect(() => {
    if (!alertMessage) return;
    if (typeof alertMessage === "string") {
      toast(alertMessage, { duration: 5000 });
    } else if (alertMessage?.message) {
      toast(alertMessage.message, {
        duration: 5000,
        action: alertMessage.action
          ? {
              label: alertMessage.action.label,
              onClick: alertMessage.action.onClick,
            }
          : undefined,
      });
    }
    setAlertMessage(undefined);
  }, [alertMessage, setAlertMessage]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen">
        <SdkInitializer />
        <AlertWatcher />
        {children}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
