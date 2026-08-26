import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("lib/server-error handleError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the handler response untouched on success", async () => {
    const { handleError } = await import("../server-error");
    const fn = vi.fn().mockResolvedValue(NextResponse.json({ data: "ok" }));

    const result = await handleError(fn);

    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ data: "ok" });
  });

  it("answers an unexpected Error with a generic 500, hides the message, and reports to Sentry", async () => {
    const Sentry = await import("@sentry/nextjs");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { handleError } = await import("../server-error");
    const fn = vi.fn().mockRejectedValue(new Error("secret internal detail"));

    const result = await handleError(fn);
    const resultJson = await result.json();

    expect(result.status).toBe(500);
    expect(resultJson).toEqual({ error: "Internal Server Error" });
    expect(JSON.stringify(resultJson)).not.toContain("secret internal detail");
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("answers a non-Error rejection with the same generic 500", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { handleError } = await import("../server-error");
    const fn = vi.fn().mockRejectedValue("String error");

    const result = await handleError(fn);

    expect(result.status).toBe(500);
    expect(await result.json()).toEqual({ error: "Internal Server Error" });

    consoleError.mockRestore();
  });

  it("passes through the status and client-safe message of an HttpError-shaped rejection", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { handleError } = await import("../server-error");
    const fn = vi.fn().mockRejectedValue(
      Object.assign(new Error("Domain not found"), {
        status: 404,
        body: { message: "Domain not found" },
      }),
    );

    const result = await handleError(fn);

    expect(result.status).toBe(404);
    expect(await result.json()).toEqual({ error: "Domain not found" });

    consoleError.mockRestore();
  });
});
