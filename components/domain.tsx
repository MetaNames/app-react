"use client";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JdenticonAvatar } from "@/components/domain-avatar";
import { DetailsContent } from "@/components/domain-details";
import { Records } from "@/components/records";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { useRecordStore } from "@/lib/stores/record-store";
import {
  PROFILE_RECORD_TYPES,
  SOCIAL_RECORD_TYPES,
  type Domain as DomainType,
} from "@/lib/types";
import { createRecordRepository } from "@/lib/records";
import { useRouter } from "next/navigation";

interface DomainProps {
  domain: DomainType;
  isTld?: boolean;
  onRefresh?: () => void;
}

export function Domain({ domain, isTld = false, onRefresh }: DomainProps) {
  const address = useWalletStore((s) => s.address);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const router = useRouter();
  const isOwner =
    address &&
    domain.owner &&
    address.toLowerCase() === domain.owner.toLowerCase();
  const repository = metaNamesSdk ? createRecordRepository(metaNamesSdk) : null;

  const setRepository = useRecordStore((s) => s.setRepository);
  const setOnUpdate = useRecordStore((s) => s.setOnUpdate);

  useEffect(() => {
    if (repository) {
      setRepository(repository);
      setOnUpdate(onRefresh ?? (() => {}));
    }
  }, [repository, onRefresh, setRepository, setOnUpdate]);

  const profileRecords = PROFILE_RECORD_TYPES.filter(
    (t) => domain.records?.[t],
  );
  const socialRecords = SOCIAL_RECORD_TYPES.filter((t) => domain.records?.[t]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="avatar">
          <JdenticonAvatar value={domain.name} size={64} />
        </div>
        <div>
          <h5 className="domain text-2xl font-bold" data-testid="domain-title">
            {domain.name}
          </h5>
          <p className="text-muted-foreground text-sm">#{domain.tokenId}</p>
        </div>
      </div>
      {isOwner && !isTld ? (
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details" data-testid="tab-details">
              details
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <DetailsContent
              domain={domain}
              profileRecords={profileRecords}
              socialRecords={socialRecords}
              isTld={isTld}
            />
          </TabsContent>
          <TabsContent value="settings" className="mt-4 flex flex-col gap-4">
            {repository && <Records records={domain.records ?? {}} />}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.push(`/domain/${domain.name}/renew`)}
              >
                Renew
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/domain/${domain.name}/transfer`)}
              >
                Transfer
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <DetailsContent
          domain={domain}
          profileRecords={profileRecords}
          socialRecords={socialRecords}
          isTld={isTld}
        />
      )}
    </div>
  );
}
