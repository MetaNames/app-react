"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GoBackButton } from "@/components/go-back-button";
import { ConnectionRequired } from "@/components/connection-required";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { validateAddress } from "@/lib/wallet";
import { explorerTransactionUrl } from "@/lib/url";
import { normalizeDomain } from "@/lib/domain-validator";
import { toast } from "sonner";

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
    router.push(`/domain/${domainName}`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <GoBackButton href={`/domain/${domainName}`} />
      <h2 className="text-2xl font-bold">Transfer domain</h2>
      <h4 className="text-xl">{domainName}</h4>
      <div className="flex flex-col gap-2 p-4 bg-muted rounded-lg">
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
  );
}
