import { describe, expect, it } from "vitest";
import { loadOrReport, resultOrReport } from "../load-error";

describe("loadOrReport", () => {
  it("returns ok:true with the resolved value on success", async () => {
    const result = await loadOrReport(
      Promise.resolve({ name: "alice" }),
      "fallback",
    );
    expect(result).toEqual({ ok: true, value: { name: "alice" } });
  });

  it("returns ok:false with the error message when the promise rejects", async () => {
    const result = await loadOrReport(
      Promise.reject(new Error("network down")),
      "fallback",
    );
    expect(result).toEqual({ ok: false, message: "network down" });
  });

  it("falls back to the provided message for non-Error rejections", async () => {
    const result = await loadOrReport(
      Promise.reject("boom"),
      "fallback message",
    );
    expect(result).toEqual({ ok: false, message: "fallback message" });
  });
});

describe("resultOrReport", () => {
  it("returns ok:true when data is present and there is no error", () => {
    const result = resultOrReport(
      { data: { domainPresent: false, parentPresent: false }, error: null },
      "fallback",
    );
    expect(result).toEqual({
      ok: true,
      value: { domainPresent: false, parentPresent: false },
    });
  });

  it("treats an explicit error as a failed load, not an available domain", () => {
    const result = resultOrReport(
      { data: null, error: "HTTP error 500" },
      "fallback",
    );
    expect(result).toEqual({ ok: false, message: "HTTP error 500" });
  });

  it("treats missing data (no error) as a failed load via the fallback message", () => {
    const result = resultOrReport(
      { data: null, error: null },
      "fallback message",
    );
    expect(result).toEqual({ ok: false, message: "fallback message" });
  });
});
