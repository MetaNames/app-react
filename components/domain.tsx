"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chip } from "@/components/chip";
import { Records } from "@/components/records";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { explorerAddressUrl, shortLinkUrl } from "@/lib/url";
import { formatDate, truncateAddress } from "@/lib/utils";
import {
  PROFILE_RECORD_TYPES,
  SOCIAL_RECORD_TYPES,
  type Domain as DomainType,
} from "@/lib/types";
import { createRecordRepository, isUrlRecord } from "@/lib/records";
import { useRouter } from "next/navigation";

interface DomainProps {
  domain: DomainType;
  isTld?: boolean;
  onRefresh?: () => void;
}

function JdenticonAvatar({
  value,
  size = 64,
}: {
  value: string;
  size?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    import("jdenticon").then(({ update }) => {
      if (ref.current) update(ref.current, value);
    });
  }, [value]);
  return <svg ref={ref} width={size} height={size} className="rounded-lg" />;
}

function DetailsContent({
  domain,
  profileRecords,
  socialRecords,
  isTld,
}: {
  domain: DomainType;
  profileRecords: string[];
  socialRecords: string[];
  isTld: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {profileRecords.length > 0 && (
        <section>
          <h5 className="font-semibold mb-3">Profile</h5>
          <div className="flex flex-wrap gap-2">
            {profileRecords.map((type) => {
              const val = domain.records[type];
              if (type === "Uri")
                return <Chip key={type} label="link" value={val} href={val} />;
              return (
                <Chip
                  key={type}
                  label={type.toLowerCase()}
                  value={type === "Price" ? `${val} $` : val}
                />
              );
            })}
            <Chip
              label="link"
              href={shortLinkUrl(domain.name)}
              value={shortLinkUrl(domain.name)}
            />
          </div>
        </section>
      )}
      <section>
        <h5 className="font-semibold mb-3">Whois</h5>
        <div className="flex flex-wrap gap-2">
          <Chip
            label="Owner"
            value={truncateAddress(domain.owner)}
            href={explorerAddressUrl(domain.owner, isTld)}
          />
          {domain.expiresAt && (
            <Chip label="Expires" value={formatDate(domain.expiresAt)} />
          )}
          {domain.parentId && (
            <Chip
              label="Parent"
              value={domain.parentId}
              href={`/domain/${domain.parentId}`}
            />
          )}
        </div>
      </section>
      {socialRecords.length > 0 && (
        <section>
          <h5 className="font-semibold mb-3">Social</h5>
          <div className="flex flex-wrap gap-2">
            {socialRecords.map((type) => (
              <Chip
                key={type}
                label={type.toLowerCase()}
                value={domain.records[type]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function Domain({ domain, isTld = false, onRefresh }: DomainProps) {
  const { address } = useWalletStore();
  const { metaNamesSdk } = useSdkStore();
  const router = useRouter();
  const isOwner =
    address &&
    domain.owner &&
    address.toLowerCase() === domain.owner.toLowerCase();
  const repository = metaNamesSdk ? createRecordRepository(metaNamesSdk) : null;

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
            {repository && (
              <Records
                records={domain.records ?? {}}
                repository={repository}
                onUpdate={onRefresh ?? (() => {})}
              />
            )}
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
