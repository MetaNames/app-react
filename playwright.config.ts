import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // These tests drive a live testnet: an RPC hiccup or a slow block is not a
  // product defect. One local retry separates a real regression from noise
  // without hiding a test that fails deterministically.
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [["github"], ["html"]] : [["list"], ["html"]],
  // A blockchain write can take a minute; the 30s default kills healthy tests.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    // `on-first-retry` leaves the final failing run untraced when retries are
    // exhausted, which is exactly the run worth inspecting.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  // One worker per core turns the dev server into the bottleneck: every worker
  // requests a different uncompiled route at once and they all wait. Four keeps
  // the suite parallel without the compile storm.
  workers: process.env.CI ? 1 : 4,
  projects: [
    {
      name: "warmup",
      testMatch: /warmup\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: /warmup\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["warmup"],
    },
  ],
  // `next dev`, not a production build: the dev private-key connector the whole
  // suite signs with refuses to run outside development ("This method is only
  // available in development mode", lib/wallet.ts), so a production server can
  // never authenticate a test. The compile-on-demand cost that comes with dev
  // is paid up front by the warmup project instead.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    // A cold Next dev compile of the first route routinely outruns the 60s
    // default and reports as a server that never came up.
    timeout: 180_000,
  },
});
