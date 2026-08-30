# Metanames

A modern web application built with Next.js for managing and interacting with blockchain-based domain names on the Partisia Blockchain.

## Introduction

Metanames provides a user-friendly interface for registering, managing, and transferring blockchain domain names. Built with Next.js and modern React patterns, it offers a seamless experience for Web3 domain management with support for hardware wallets, real-time updates, and comprehensive domain analytics.

## Features

- **Domain Management** - Register, transfer, and manage blockchain domain names
- **Hardware Wallet Support** - Integration with Ledger devices via WebUSB
- **Real-time Updates** - Live domain status and transaction tracking
- **Analytics Dashboard** - Visual charts and statistics for domain data
- **Dark/Light Theme** - Automatic theme support based on system preferences
- **Multi-network Support** - Built on Partisia Blockchain infrastructure
- **Error Tracking** - Sentry integration for production monitoring
- **Responsive Design** - Works seamlessly across all device sizes

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Error Tracking**: Sentry
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Notifications**: Sonner

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill it in. Only `NEXT_PUBLIC_ENV`
selects the chain; everything else is a per-deployment value.

| Variable                        | Required | Description                                                                                     |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ENV`               | yes      | `test` (Partisia testnet) or `prod` (mainnet). Unset defaults to `test`. See the warning below. |
| `NEXT_PUBLIC_LANDING_URL`       | no       | Marketing site linked from the app. Defaults to `https://metanames.app`.                        |
| `NEXT_PUBLIC_WEBSITE_URL`       | no       | Canonical app URL for `metadataBase`, `robots.txt` and `sitemap.xml`. Keep the trailing slash.  |
| `NEXT_PUBLIC_CONTRACT_DISABLED` | no       | `true` shows the "contract temporarily disabled" banner. Defaults to `false`.                   |
| `NEXT_PUBLIC_SENTRY_DSN`        | no       | Sentry DSN for browser error capture. Empty disables it.                                        |
| `SENTRY_DSN`                    | no       | Sentry DSN for server-side capture. Empty disables it.                                          |
| `SENTRY_ORG` / `SENTRY_PROJECT` | no       | Used by the Sentry build plugin to upload source maps.                                          |
| `TESTNET_PRIVATE_KEY`           | no       | Testnet key used by the Playwright e2e suite only. Never set this on a deployment.              |

> **`NEXT_PUBLIC_ENV` must be exactly `test` or `prod`.** Any other value (for
> example `staging` or `testnet`) is treated as `prod` by `lib/config.ts` while
> `app/api/account/balance/route.ts` still reads testnet, so the client and the
> balance API end up on different chains. A staging deployment that should run
> against testnet sets `NEXT_PUBLIC_ENV=test`.

`NEXT_PUBLIC_ENV=test` also turns on the testnet banner and header badge, the
wallet dev-key input, full Sentry trace sampling, and points the SDK, the block
explorer links and the TLD migration contract address at testnet.

Recommended per environment:

| Deployment | `NEXT_PUBLIC_ENV` | `NEXT_PUBLIC_WEBSITE_URL`    |
| ---------- | ----------------- | ---------------------------- |
| local      | `test`            | `http://localhost:3000/`     |
| staging    | `test`            | the staging host             |
| production | `prod`            | `https://app.metanames.app/` |

## Development

### Available Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start development server             |
| `npm run build`    | Build for production                 |
| `npm run start`    | Start production server              |
| `npm run lint`     | Run ESLint                           |
| `npm run test`     | Run unit tests with Vitest           |
| `npm run test:run` | Run unit tests once                  |
| `npm run test:e2e` | Run end-to-end tests with Playwright |

### Code Style

This project uses ESLint and TypeScript for code quality. Ensure your code passes linting before submitting changes.

## Testing

### Unit Tests

Unit tests are written with Vitest and React Testing Library. Run them with:

```bash
npm run test
```

For continuous testing during development:

```bash
npm run test
# in watch mode
```

To run tests once without watch mode:

```bash
npm run test:run
```

### End-to-End Tests

E2E tests use Playwright. First, ensure the development server is running, then:

```bash
npm run test:e2e
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all tests pass and your code follows the project's linting rules before submitting.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
