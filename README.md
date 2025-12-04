# Warelay Agent

An autonomous AI agent framework with personality, memory, and trading capabilities. Built for WhatsApp, Twitter, and extensible to other platforms.

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run the sentient agent
npm run sentient

# Or use the CLI
npm start -- send --provider web --to "+1234567890" --message "Hello"
```

## Features

- **Sentient Personality**: Memory, context-awareness, proactive behavior
- **Prediction Market**: Multi-source data analysis for market forecasts
- **Autonomous Trading**: Solana memecoin trading with risk management
- **Multi-Platform**: WhatsApp (web), Twitter, extensible architecture
- **Real-Time Terminal**: Web dashboard for monitoring trades and agent thoughts
- **Agent Builder**: No-code tool for creating custom Warelay agents

## Documentation

- [Sentient Agent Guide](WARELAY.md)
- [Prediction Market](PREDICTIONS.md)
- [Trading System Setup](TRADING.md)
- [Trading Terminal](TERMINAL.md)
- [Repository Guidelines](AGENTS.md)

## Project Structure

```
src/
├── cli/              # CLI commands and wiring
├── commands/         # Core commands (send, webhook, etc)
├── sentient/         # Personality, memory, auto-reply
├── trading/          # Solana trading engine
├── api/              # Trading data API server
├── providers/        # Platform providers (Twitter, Web)
└── agents/           # AI model integrations

website/              # Landing page, terminal, agent builder
docs/                 # Additional documentation
```

## Scripts

- `npm run sentient` - Launch sentient agent with personality
- `npm run trading-api` - Start trading data API server
- `npm run website` - Serve website locally (port 3000)
- `npm run build` - Compile TypeScript
- `npm test` - Run test suite

## Deployment

Website deployed at Vercel. Auto-deploys from `main` branch.

Repository: https://github.com/warelayagent/warelay-agent

## License

MIT
