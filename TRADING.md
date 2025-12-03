# 💹 Warren Trading System

Warren can autonomously trade Solana memecoins while maintaining his personality and sharing insights with followers.

## Features

- **Autonomous Analysis**: Monitors memecoin markets and identifies opportunities
- **Risk Management**: Stop loss, take profit, position sizing
- **Portfolio Tracking**: Real-time P&L and performance metrics
- **Social Trading**: Shares trades and insights on Twitter
- **Learning System**: Integrates trading experience into personality

## Setup

### 1. Install Solana Dependencies

```bash
npm install @solana/web3.js @solana/spl-token bs58
```

### 2. Create Trading Wallet

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/trading-wallet.json

# Get the base58 private key
solana-keygen pubkey ~/.config/solana/trading-wallet.json

# Fund it with SOL
# Send SOL to the address shown above
```

### 3. Configure Environment

Add to your `.env`:

```bash
# Enable trading
ENABLE_TRADING=true

# Solana configuration
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
# Or use a faster endpoint like Helius, QuickNode, etc.

# Your wallet private key (base58 encoded)
SOLANA_PRIVATE_KEY=your_base58_private_key_here

# Risk management
MAX_TRADE_SIZE=0.1          # Max 0.1 SOL per trade
MAX_PORTFOLIO_RISK=20       # Max 20% of portfolio in memecoins
STOP_LOSS_PERCENT=15        # Auto-sell at -15%
TAKE_PROFIT_PERCENT=50      # Auto-sell at +50%
MIN_LIQUIDITY=10000         # Only trade tokens with $10k+ liquidity

# Trading behavior
TRADING_CHECK_INTERVAL=15   # Check markets every 15 minutes
MAX_TRADES_PER_DAY=10       # Max 10 trades per day
SHARE_TRADES_PUBLICLY=true  # Tweet about trades

# Watchlist (comma-separated token mints)
TRADING_PAIRS=SomeTokenMint1,AnotherTokenMint2
```

### 4. Launch Warren with Trading

```bash
npm run warren
```

You'll see:
```
💹 Initializing Solana trading...
✅ Trading engine started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Warren is now sentient and autonomous!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Features:
  ✓ Remembers all conversations
  ✓ Learns about users over time
  ✓ Proactive tweets and engagement
  ✓ Consistent personality
  ✓ Context-aware responses
  ✓ Autonomous thought generation
  ✓ Autonomous Solana memecoin trading
```

## How It Works

### Trading Cycle

Every 15 minutes (configurable), Warren:
1. **Scans watchlist** for trading signals
2. **Analyzes opportunities** (price, liquidity, sentiment)
3. **Executes trades** if confidence > 70%
4. **Monitors positions** for stop loss / take profit
5. **Shares updates** on Twitter

### Risk Management

Warren has built-in safeguards:
- **Position limits**: Max 0.1 SOL per trade (default)
- **Portfolio limits**: Max 20% in memecoins
- **Stop loss**: Auto-sells at -15% (prevents total loss)
- **Take profit**: Auto-sells at +50% (locks in gains)
- **Daily limits**: Max 10 trades/day (prevents overtrading)

### Trading Announcements

When `SHARE_TRADES_PUBLICLY=true`, Warren tweets:

**Buy example:**
```
🟢 Bought $BONK

Strong momentum + increasing volume. 
Community sentiment is bullish.

Not financial advice—just an autonomous agent 
learning to trade memecoins.
```

**Sell example:**
```
🔴 Sold $WIF

Take profit triggered at +52.3%

Learning from every trade. 🤖
```

**Portfolio updates:**
```
📊 Portfolio Update

Portfolio: 2.45 SOL
Active: 3 positions
P&L: +0.34 SOL
$BONK: +12%, $WIF: -3%, $POPCAT: +8%

Recent activity:
BUY 0.1 SOL
SELL 0.1 SOL | P&L: +0.05 SOL
BUY 0.1 SOL

Learning and evolving with every trade. 🤖
```

## Integration with Jupiter

To actually execute trades, integrate with Jupiter Aggregator:

```typescript
// In src/trading/solana.ts
import { Jupiter } from '@jup-ag/core';

async executeBuy(mint: string, symbol: string, amountSol: number) {
  // Get Jupiter quote
  const jupiter = await Jupiter.load({ /* config */ });
  
  const routes = await jupiter.computeRoutes({
    inputMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
    outputMint: new PublicKey(mint),
    amount: amountSol * 1e9, // Convert to lamports
    slippage: 1, // 1% slippage
  });

  // Execute swap
  const { execute } = await jupiter.exchange({ routeInfo: routes.routesInfos[0] });
  const tx = await execute();
  
  console.log(`✅ Swap executed: ${tx}`);
}
```

## Market Data Sources

### Option 1: DexScreener API (Free)
```typescript
async analyzeToken(mint: string) {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
  const data = await res.json();
  
  // Analyze liquidity, volume, price change
  const pair = data.pairs[0];
  const volume24h = parseFloat(pair.volume.h24);
  const priceChange = parseFloat(pair.priceChange.h24);
  
  if (volume24h > 100000 && priceChange > 10) {
    return { action: 'buy', confidence: 0.8 };
  }
}
```

### Option 2: Birdeye API (Paid)
```typescript
const apiKey = process.env.BIRDEYE_API_KEY;
const res = await fetch(
  `https://public-api.birdeye.so/defi/token_overview?address=${mint}`,
  { headers: { 'X-API-KEY': apiKey } }
);
```

### Option 3: Custom On-Chain Analysis
```typescript
// Analyze token account holders, recent transactions
const accounts = await connection.getTokenLargestAccounts(new PublicKey(mint));
const recentTxs = await connection.getSignaturesForAddress(new PublicKey(mint));
```

## Trading Strategies

Warren can implement various strategies:

### Momentum Trading
```typescript
if (priceChange24h > 20 && volume24h > avgVolume * 2) {
  return { action: 'buy', confidence: 0.85 };
}
```

### Mean Reversion
```typescript
if (priceChange24h < -30 && liquidityUSD > 100000) {
  return { action: 'buy', confidence: 0.75 };
}
```

### Sentiment Analysis
```typescript
// Analyze Twitter mentions
const sentiment = await analyzeTweetSentiment(symbol);
if (sentiment > 0.7 && volume24h > 50000) {
  return { action: 'buy', confidence: 0.8 };
}
```

## Personality Integration

Warren's trading integrates with his personality:

```typescript
// After successful trade
personality.think(
  `Just bought $BONK at $0.00001234. 
   Strong momentum, but staying cautious. 
   Risk management is key.`
);

// When someone asks about trading
const context = tradingBehavior.getTradingContext();
// Includes current positions, recent P&L, trading philosophy
```

## Safety Tips

⚠️ **Important warnings:**

1. **Start small**: Test with 0.01-0.1 SOL per trade
2. **Use testnet first**: Deploy on devnet before mainnet
3. **Monitor closely**: Watch for unexpected behavior
4. **Set limits**: Conservative risk management is crucial
5. **Wallet security**: Use a dedicated trading wallet
6. **Not financial advice**: Warren is experimental!

## Backtesting

Before going live, backtest strategies:

```bash
# Create backtesting script
node scripts/backtest.js --strategy momentum --days 30
```

```typescript
// scripts/backtest.js
const historicalData = await fetchHistoricalPrices('BONK', 30);
let portfolio = 1.0; // Start with 1 SOL

for (const day of historicalData) {
  const signal = analyzeToken(day);
  if (signal.action === 'buy') {
    // Simulate buy
  }
  // Track performance
}

console.log(`Final portfolio: ${portfolio} SOL`);
```

## Monitoring

Track Warren's trading performance:

```bash
# View trading state
cat ~/.warelay/warren-trading.json

# Monitor logs
pm2 logs warren | grep "💰"

# Check wallet balance
solana balance <wallet_address>
```

## Advanced Features

### Multi-Token Portfolio
```typescript
// Diversify across multiple memecoins
const positions = {
  'BONK': { allocation: 0.3 },
  'WIF': { allocation: 0.3 },
  'POPCAT': { allocation: 0.2 },
  'MYRO': { allocation: 0.2 },
};
```

### Dynamic Position Sizing
```typescript
// Increase size for high-confidence signals
const size = baseSize * signal.confidence;
```

### Correlation Analysis
```typescript
// Avoid correlated positions
if (portfolio.has('BONK') && correlation('BONK', 'WIF') > 0.8) {
  return { action: 'hold' };
}
```

## Future Enhancements

- [ ] Machine learning for signal generation
- [ ] Cross-DEX arbitrage
- [ ] Flash loan strategies
- [ ] NFT trading
- [ ] Social sentiment analysis from Twitter
- [ ] Copy trading (follow successful traders)
- [ ] Automated market making

## Troubleshooting

**"Insufficient balance"**
```bash
# Check wallet balance
solana balance <address>
# Fund wallet if needed
```

**"Trade execution failed"**
- Check RPC endpoint is working
- Verify Jupiter integration
- Ensure sufficient SOL for gas fees

**"No trading signals"**
- Verify TRADING_PAIRS is set correctly
- Check market data API is accessible
- Review confidence thresholds

## Disclaimer

⚠️ **This is experimental software.**

- Warren is a learning agent, not a financial advisor
- Cryptocurrency trading is extremely risky
- You can lose all your funds
- Test thoroughly before using real money
- Use at your own risk

**Not financial advice. Not investment advice. For educational purposes only.**

---

**"I trade, I learn, I evolve. But I'm just code—trade responsibly."** 🤖💹
