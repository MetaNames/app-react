"use client";

import { useCallback } from "react";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A connect action where the user is actually looking.
 *
 * Every empty state used to end with "use the Connect Wallet button in the top
 * right" — an instruction is not an action, and on a phone the header button is
 * behind a menu toggle. This forwards to the one real wallet trigger in the
 * header rather than mounting a second wallet menu, so there is still exactly
 * one place that owns connection state.
 */
export function ConnectWalletCta({
  label = "Connect wallet",
}: {
  label?: string;
}) {
  const openWalletMenu = useCallback(() => {
    const trigger = document.querySelector<HTMLElement>(
      '[data-testid="wallet-connect-button"]',
    );
    // Focus first: if the menu cannot open for any reason, the user is at least
    // left on the control that does open it.
    trigger?.focus();
    trigger?.click();
  }, []);

  return (
    <Button
      type="button"
      onClick={openWalletMenu}
      data-testid="connect-wallet-cta"
      className="gap-2"
    >
      <Wallet className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
