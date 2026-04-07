"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingButton } from "@/components/loading-button";
import { Chip } from "@/components/chip";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { explorerTransactionUrl } from "@/lib/url";
import { toast } from "sonner";
import type { BYOCSymbol as SdkBYOCSymbol } from "@metanames/sdk/dist/providers/config";

interface SubdomainRegistrationProps {
  domain: string;
  parentDomain: string;
  byocSymbol?: string;
}
export function SubdomainRegistration({
  domain,
  parentDomain,
  byocSymbol,
}: SubdomainRegistrationProps) {
  const router = useRouter();
  const address = useWalletStore((s) => s.address);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);

  const handleRegister = async () => {
    if (!metaNamesSdk || !address) return;
    const intent = await metaNamesSdk.domainRepository.register({
      domain,
      parentDomain,
      to: address,
      byocSymbol: (byocSymbol || "TEST_COIN") as SdkBYOCSymbol,
    });
    const txHash = intent.transactionHash;
    toast("New Transaction submitted", {
      action: {
        label: "View",
        onClick: () => window.open(explorerTransactionUrl(txHash), "_blank"),
      },
      duration: 10000,
    });
    await intent.fetchResult;
    toast.success("Domain registered successfully!", {
      action: {
        label: "Go to profile",
        onClick: () => router.push("/profile"),
      },
    });
    router.push(`/domain/${domain}`);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{domain}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Parent:</span>
          <Chip
            label="parent"
            value={parentDomain}
            href={`/domain/${parentDomain}`}
          />
        </div>
        <div className="flex items-center justify-between py-2 border-t">
          <span className="text-muted-foreground">Price</span>
          <span className="font-bold text-[hsl(var(--chip-available-fg))]">
            FREE
          </span>
        </div>
        <LoadingButton onClick={handleRegister} className="w-full">
          Register domain
        </LoadingButton>
      </CardContent>
    </Card>
  );
}
