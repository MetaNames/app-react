"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GoBackButton } from "@/components/go-back-button";
import { CompactPage } from "@/components/compact-page";
import { ConnectionRequired } from "@/components/connection-required";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { validateAddress } from "@/lib/wallet";
import { explorerTransactionUrl } from "@/lib/url";
import { normalizeDomain } from "@/lib/domain-validator";
import { toast } from "sonner";
import { track } from "@vercel/analytics";

export default function TransferPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const domainName = normalizeDomain(decodeURIComponent(name));
  const address = useWalletStore((s) => s.address);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const [recipient, setRecipient] = useState("");
  const isValid = validateAddress(recipient);

  const handleTransfer = async () => {
    if (!metaNamesSdk || !address || !isValid) return;
    const intent = await metaNamesSdk.domainRepository.transfer({
      domain: domainName,
      from: address,
      to: recipient,
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
    toast.success("Domain transferred successfully");
    track("domain_transferred");
    router.push(`/domain/${domainName}`);
  };

  return (
    <CompactPage>
      <div className="spotlight-beam relative z-10 animate-fade-up flex flex-col gap-6 max-w-lg w-full mx-auto">
        <GoBackButton href={`/domain/${domainName}`} />
        <h1 className="text-3xl font-extrabold tracking-tight">
          Transfer domain
        </h1>
        <h2 className="text-xl">{domainName}</h2>
        <div className="glass-panel rounded-2xl border-destructive/30 bg-destructive/5 p-4 flex flex-col gap-2">
          <p>
            <strong>Please note that all transfers are irreversible.</strong>
          </p>
          <p>
            <strong>Verify the address is correct</strong>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="recipient-input" className="text-sm font-medium">
            Recipient Address
          </label>
          <Input
            id="recipient-input"
            placeholder="Recipient address (42 chars)"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
            }}
            className={
              recipient.length >= 40 && !isValid ? "border-destructive" : ""
            }
          />
          {recipient.length >= 40 && !isValid && (
            <p className="text-destructive text-sm">Address is invalid</p>
          )}
        </div>
        <ConnectionRequired address={address}>
          <LoadingButton
            disabled={!isValid}
            onClick={handleTransfer}
            className="w-full"
          >
            Transfer domain
          </LoadingButton>
        </ConnectionRequired>
      </div>
    </CompactPage>
  );
}
