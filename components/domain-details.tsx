"use client";
import { Chip } from "@/components/chip";
import type { Domain as DomainType } from "@/lib/types";
import { explorerAddressUrl, shortLinkUrl } from "@/lib/url";
import { formatDate, truncateAddress } from "@/lib/utils";

export function DetailsContent({
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
