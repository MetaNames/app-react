import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Any Next.js config options go here
};

const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;
