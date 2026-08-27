"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { formatDate } from "@/lib/utils";
// Legacy surfaces expiry only as a plain date. Flagging the last month before
// expiry gives the owner a chance to act while renewal is still possible,
// which is the whole point of showing the date at all. The threshold is shared
// with the profile table so the two views cannot disagree.
import { expiryStatus, needsAttention } from "@/lib/expiry";
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  Copy,
  Loader2,
} from "lucide-react";
import { buildExpiryReminder, expiryReminderFilename } from "@/lib/calendar";

interface DomainProps {
  domain: DomainType;
  isTld?: boolean;
  onUpdate?: () => void;
}

export function Domain({ domain, isTld = false, onUpdate }: DomainProps) {
  const address = useWalletStore((s) => s.address);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const router = useRouter();
  const isOwner =
    address &&
    domain.owner &&
    address.toLowerCase() === domain.owner.toLowerCase();

  const repository = useRecordStore((s) => s.repository);
  const setRepository = useRecordStore((s) => s.setRepository);
  const clearRepository = useRecordStore((s) => s.clear);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!metaNamesSdk) {
      clearRepository();
      return;
    }
    clearRepository();
    let cancelled = false;
    createRecordRepository(metaNamesSdk, domain.name).then((repo) => {
      if (cancelled || !repo) return;
      setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, [metaNamesSdk, domain.name, setRepository, clearRepository]);

  const handleRenew = useCallback(() => {
    router.push(`/domain/${domain.name}/renew`);
  }, [domain.name, router]);

  // The expiry date is only a reminder while this page is open. Exporting it
  // as a calendar event puts the warning where the owner will actually see it
  // — a month out and a week out — without any account or notification setup.
  const handleAddReminder = useCallback(() => {
    if (!domain.expiresAt) return;
    const ics = buildExpiryReminder({
      domainName: domain.name,
      expiresAt: new Date(domain.expiresAt),
      url: window.location.href,
    });
    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = expiryReminderFilename(domain.name);
    link.click();
    URL.revokeObjectURL(url);
  }, [domain.expiresAt, domain.name]);

  const handleTransfer = useCallback(() => {
    router.push(`/domain/${domain.name}/transfer`);
  }, [domain.name, router]);

  // The reset timer is held so navigating away mid-countdown does not leave a
  // pending setState on an unmounted component.
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    [],
  );

  const handleCopyName = useCallback(async () => {
    await navigator.clipboard.writeText(domain.name);
    setCopied(true);
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => setCopied(false), 1500);
  }, [domain.name]);

  const profileRecords = PROFILE_RECORD_TYPES.filter(
    (t) => domain.records?.[t],
  );
  const socialRecords = SOCIAL_RECORD_TYPES.filter((t) => domain.records?.[t]);

  const expiry = useMemo(
    () => expiryStatus(isTld ? null : domain.expiresAt),
    [domain.expiresAt, isTld],
  );
  const expiryDays = expiry.days;
  const expiringSoon = needsAttention(expiry);

  const TitleTag = isTld ? "h2" : "h1";

  return (
    <div className="spotlight-beam flex flex-col gap-6 w-full max-w-2xl relative z-10 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="avatar p-1 rounded-2xl ring-2 ring-primary/40 shadow-[0_0_24px_var(--glow)] shrink-0 self-start">
          <JdenticonAvatar value={domain.name} size={64} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <TitleTag
              className="domain text-3xl font-extrabold tracking-tight break-all"
              data-testid="domain-title"
            >
              {domain.name}
            </TitleTag>
            <button
              type="button"
              onClick={handleCopyName}
              aria-label={`Copy ${domain.name}`}
              className="focus-ring rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            {copied && (
              <span role="status" className="sr-only">
                Copied to the clipboard
              </span>
            )}
            {isOwner && (
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[var(--chip-registered-bg)] text-[var(--chip-registered-fg)]">
                Yours
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            #{domain.tokenId}
          </p>
        </div>
        {isOwner && !isTld && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="border-primary/40 hover:border-primary hover:bg-primary/10"
              onClick={handleRenew}
            >
              Renew
            </Button>
            <Button
              variant="outline"
              className="border-primary/40 hover:border-primary hover:bg-primary/10"
              onClick={handleTransfer}
            >
              Transfer
            </Button>
            {domain.expiresAt && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Add expiry reminder to calendar"
                title="Add expiry reminder to calendar"
                data-testid="add-expiry-reminder"
                className="border-primary/40 hover:border-primary hover:bg-primary/10"
                onClick={handleAddReminder}
              >
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>
      {expiringSoon && (
        <div className="glass-panel border-destructive/40 bg-destructive/10 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <span className="flex-1">
            {expiryDays !== null && expiryDays <= 0
              ? `Expired on ${formatDate(domain.expiresAt)}.`
              : `Expires in ${expiryDays} ${expiryDays === 1 ? "day" : "days"} (${formatDate(domain.expiresAt)}).`}
          </span>
          {/* A warning with no way to act on it makes the owner hunt for the
              renew button that is only rendered for them further up. */}
          {isOwner && (
            <Button
              size="sm"
              className="shrink-0"
              onClick={handleRenew}
              data-testid="expiry-renew"
            >
              Renew now
            </Button>
          )}
        </div>
      )}
      {isOwner && !isTld ? (
        <Tabs defaultValue="details">
          <TabsList className="glass-panel rounded-xl p-1 bg-transparent">
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
            {repository ? (
              <Records records={domain.records ?? {}} onUpdate={onUpdate} />
            ) : (
              // The record repository is derived from a chain read; until it
              // resolves this panel rendered as a blank rectangle, which reads
              // as "this domain has no settings" rather than "still loading".
              <div
                className="glass-panel rounded-2xl p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"
                role="status"
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading records...
              </div>
            )}
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
