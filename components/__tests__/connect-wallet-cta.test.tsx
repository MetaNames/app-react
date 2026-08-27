import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { ConnectWalletCta } from "../connect-wallet-cta";

afterEach(cleanup);

/** Stand in for the header's wallet trigger, which lives outside this tree. */
function mountHeaderTrigger() {
  const trigger = document.createElement("button");
  trigger.setAttribute("data-testid", "wallet-connect-button");
  const click = vi.fn();
  const focus = vi.fn();
  trigger.addEventListener("click", click);
  trigger.focus = focus;
  document.body.appendChild(trigger);
  return { trigger, click, focus };
}

describe("ConnectWalletCta", () => {
  it("opens the header wallet menu", () => {
    const { click, focus } = mountHeaderTrigger();
    render(<ConnectWalletCta />);

    fireEvent.click(screen.getByTestId("connect-wallet-cta"));

    expect(focus).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it("does nothing when there is no wallet trigger on the page", () => {
    // The header renders a connected chip instead of a trigger once a wallet is
    // attached; the CTA must not throw in that window.
    render(<ConnectWalletCta />);
    expect(() =>
      fireEvent.click(screen.getByTestId("connect-wallet-cta")),
    ).not.toThrow();
  });

  it("uses the label it is given", () => {
    render(<ConnectWalletCta label="Connect to renew" />);
    expect(screen.getByTestId("connect-wallet-cta")).toHaveTextContent(
      "Connect to renew",
    );
  });
});
