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

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:run` | Run unit tests once |
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
