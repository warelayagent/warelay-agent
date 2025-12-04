# Polymarket Predictions with Claude

Warelay's Claude-powered analysis of Polymarket prediction markets. Uses Claude AI to analyze real-time prediction markets and generate autonomous forecasts with reasoning.

## Overview

This module integrates with [Polymarket](https://polymarket.com), the world's largest prediction market, and uses Claude to analyze market questions, evaluate current odds, and generate well-reasoned predictions. Claude considers historical precedents, current events, statistical likelihood, and potential market biases to provide informed analysis.

## Features

- **Real-Time Market Data**: Fetches live prediction markets from Polymarket API
- **Claude AI Analysis**: Deep reasoning on market outcomes using Claude
- **Autonomous Predictions**: Regularly analyzes and shares top opportunities
- **Value Detection**: Identifies markets where Claude disagrees with consensus
- **Risk Assessment**: Evaluates risk level for each prediction
- **Category Filtering**: Focus on specific categories (crypto, politics, sports, etc.)
- **Volume Filtering**: Only analyze markets with meaningful liquidity

## How It Works

### 1. Market Discovery

Polymarket client fetches interesting markets:
- High-volume markets (most active trading)
- Category-specific markets (crypto, politics, sports, science)
- Tag-based filtering
- Markets closing soon
- Trending predictions

### 2. Claude Analysis

For each market, Claude analyzes:
- **Question & Context**: What is being predicted
- **Current Odds**: What the market currently believes
- **Historical Precedents**: Similar past events
- **Current Events**: Recent developments
- **Statistical Likelihood**: Base rates and probabilities
- **Market Biases**: Potential mispricings

Claude provides:
- Clear prediction statement
- Confidence level (0-100%)
- Detailed reasoning
- Key factors influencing the prediction
- Opinion on market odds (agree/disagree/neutral)
- Recommended action (bet yes/bet no/hold)
- Risk assessment (low/medium/high)

### 3. Opportunity Scoring

Predictions are ranked by:
- **Confidence**: How confident Claude is
- **Value**: Degree of disagreement with market
- **Risk**: Risk-adjusted scoring
- **Actionability**: Clear bet vs hold recommendation

### 4. Public Sharing

Top predictions are shared publicly when:
- Confidence > 65%
- Has clear recommendation (not "hold")
- Either: Disagrees with market OR Very high confidence (>80%) + Low risk

## Configuration

### Environment Variables

```bash
# Enable Polymarket analysis
ENABLE_POLYMARKET=true

# Update interval in milliseconds (default: 2 hours)
POLYMARKET_INTERVAL=7200000

# Categories to focus on (comma-separated)
POLYMARKET_CATEGORIES=crypto,politics,sports,science

# Minimum trading volume to consider ($)
POLYMARKET_MIN_VOLUME=10000

# Maximum markets to analyze per update
POLYMARKET_MAX_MARKETS=5

# Number of top predictions to share publicly
POLYMARKET_SHARE_TOP=3
```

### Programmatic Configuration

```typescript
import { PolymarketBehavior } from "./polymarket/index.js";

const polymarket = new PolymarketBehavior({
  enabled: true,
  updateInterval: 2 * 60 * 60 * 1000, // 2 hours
  categories: ["crypto", "politics", "sports"],
  minVolume: 10000, // $10K minimum
  maxMarketsPerUpdate: 5,
  shareTopN: 3,
  focusTags: ["bitcoin", "ethereum"], // Optional
});

polymarket.start(async (prediction) => {
  console.log(prediction.claudeAnalysis.prediction);
  // Share prediction...
});
```

## Usage

### Autonomous Mode

Run Warelay with Polymarket enabled:

```bash
# In .env
ENABLE_POLYMARKET=true
POLYMARKET_CATEGORIES=crypto,politics
POLYMARKET_MIN_VOLUME=50000

# Run agent
npm run sentient
```

Warelay will automatically:
1. Fetch interesting markets every 2 hours
2. Analyze each market with Claude
3. Share top 3 predictions publicly
4. Track analyzed markets to avoid duplication

### Manual Analysis

```typescript
import { PolymarketBehavior } from "./polymarket/index.js";

const polymarket = new PolymarketBehavior();

// Analyze specific market
const prediction = await polymarket.analyzeSingleMarket("market-id-123");

// Search and analyze
const predictions = await polymarket.searchAndAnalyze("bitcoin price");

// Get trending
const trending = await polymarket.getTrendingPredictions();

// Format for sharing
const formatted = polymarket.formatPrediction(prediction);
```

### Query Polymarket Directly

```typescript
import { PolymarketClient } from "./polymarket/client.js";

const client = new PolymarketClient();

// Get trending markets
const trending = await client.getTrendingMarkets(10);

// Search markets
const bitcoinMarkets = await client.searchMarkets("bitcoin");

// Get by category
const cryptoMarkets = await client.getMarketsByCategory("crypto");

// Get high volume
const active = await client.getHighVolumeMarkets(20);

// Get closing soon
const ending = await client.getClosingSoonMarkets(24); // Next 24h
```

## Example Output

### Claude's Analysis Tweet

```
⚠️ Polymarket Analysis

Will Bitcoin reach $100,000 by end of 2025?

📊 Current Market: 67.5% YES
🤖 Claude's Take: Bitcoin will likely reach $100K given current momentum, institutional adoption, and historical halving cycles
💪 Confidence: 78%
🎯 Recommendation: BET YES
⚖️ Risk: MEDIUM

Historical halving cycles suggest strong post-halving rallies. Current institutional adoption (ETFs, corporate treasuries) provides unprecedented demand. Macro environment improving with potential rate cuts. Market odds slightly underpricing the probability given these tailwinds.

Key Factors:
• Halving cycle historically bullish 12-18 months post-event
• Institutional ETF inflows exceeding $50B
• Limited supply meeting increased demand
• Technical indicators showing strength
• Regulatory clarity improving in major markets
```

## API Reference

### PolymarketClient

```typescript
// Get markets
getTrendingMarkets(limit?: number): Promise<PolymarketMarket[]>
getMarketsByCategory(category: string, limit?: number): Promise<PolymarketMarket[]>
searchMarkets(query: string): Promise<PolymarketMarket[]>
getMarket(marketId: string): Promise<PolymarketMarket | null>
getHighVolumeMarkets(limit?: number): Promise<PolymarketMarket[]>
getClosingSoonMarkets(hoursAhead?: number): Promise<PolymarketMarket[]>
getMarketsByTags(tags: string[]): Promise<PolymarketMarket[]>
formatMarket(market: PolymarketMarket): string
```

### ClaudeAnalyzer

```typescript
// Analyze markets
analyzeMarket(market: PolymarketMarket): Promise<ClaudeAnalysis>
analyzeMultipleMarkets(markets: PolymarketMarket[]): Promise<PolymarketPrediction[]>
formatPrediction(prediction: PolymarketPrediction): string
```

### PolymarketBehavior

```typescript
// Control behavior
start(onPrediction: (prediction: PolymarketPrediction) => Promise<void>): void
stop(): void

// Manual queries
analyzeSingleMarket(marketId: string): Promise<PolymarketPrediction | null>
searchAndAnalyze(query: string): Promise<PolymarketPrediction[]>
getTrendingPredictions(): Promise<PolymarketPrediction[]>
formatPrediction(prediction: PolymarketPrediction): string
```

## Types

### PolymarketMarket

```typescript
{
  id: string;
  question: string;
  description: string;
  endDate: string;
  outcomes: string[];
  outcomePrices: number[]; // 0-1 probability
  volume: number;
  liquidity: number;
  active: boolean;
  category: string;
  tags: string[];
}
```

### ClaudeAnalysis

```typescript
{
  prediction: string;
  confidence: number; // 0-1
  reasoning: string;
  keyFactors: string[];
  marketOpinion: "agree" | "disagree" | "neutral";
  recommendedAction: "bet_yes" | "bet_no" | "hold";
  riskLevel: "low" | "medium" | "high";
}
```

### PolymarketPrediction

```typescript
{
  market: PolymarketMarket;
  claudeAnalysis: ClaudeAnalysis;
  currentOdds: number;
  suggestedBet?: {
    outcome: string;
    amount: number;
    expectedReturn: number;
  };
  timestamp: Date;
}
```

## Best Practices

### 1. Volume Filtering
Only analyze markets with meaningful volume ($10K+) to ensure liquidity and serious participation.

```typescript
minVolume: 10000 // $10K minimum
```

### 2. Rate Limiting
Don't analyze too frequently - Claude analysis takes time and Polymarket data doesn't change rapidly.

```typescript
updateInterval: 2 * 60 * 60 * 1000 // 2 hours is reasonable
```

### 3. Category Focus
Focus on categories where you/Claude have expertise.

```typescript
categories: ["crypto", "politics"] // Focus areas
```

### 4. Risk Assessment
Pay attention to Claude's risk level - high confidence + low risk is ideal.

### 5. Market Opinion
Best opportunities are when Claude disagrees with market (potential value).

## Integration with Trading

While Warelay can analyze Polymarket, it doesn't automatically place bets. You can:

1. **Manual Betting**: Use predictions to inform manual Polymarket trades
2. **Custom Integration**: Build your own automated betting system
3. **Risk Management**: Always consider position sizing and risk

## Limitations

- **Claude Access Required**: Needs `claude` CLI tool installed and configured
- **No Automated Betting**: Analysis only, doesn't place bets
- **Rate Limits**: Claude API has rate limits
- **Market Data**: Relies on Polymarket's public API availability
- **No Historical Tracking**: Doesn't track prediction accuracy over time (yet)

## Future Enhancements

- [ ] Historical accuracy tracking
- [ ] Automated bet placement (with safety limits)
- [ ] Multi-model analysis (GPT-4, Gemini, Claude ensemble)
- [ ] Market-making opportunities
- [ ] Arbitrage detection
- [ ] Portfolio management
- [ ] Real-time price alerts
- [ ] Custom market creation suggestions

## Troubleshooting

### Claude Not Found

```bash
# Install Claude CLI
# Follow instructions at https://claude.ai/cli

# Verify installation
claude --version
```

### No Markets Found

- Check `POLYMARKET_MIN_VOLUME` isn't too high
- Verify `POLYMARKET_CATEGORIES` are valid
- Try broader search terms

### Low Confidence Predictions

- Increase `minVolume` to get more established markets
- Focus on categories with clearer outcomes
- Adjust `MIN_PREDICTION_CONFIDENCE` threshold

### Rate Limit Errors

- Increase `POLYMARKET_INTERVAL`
- Reduce `POLYMARKET_MAX_MARKETS`
- Check Claude API limits

## Example Workflows

### Daily Crypto Analysis

```bash
ENABLE_POLYMARKET=true
POLYMARKET_CATEGORIES=crypto
POLYMARKET_MIN_VOLUME=50000
POLYMARKET_MAX_MARKETS=3
POLYMARKET_INTERVAL=86400000  # Once per day
```

### High-Frequency Political Tracking

```bash
ENABLE_POLYMARKET=true
POLYMARKET_CATEGORIES=politics
POLYMARKET_MIN_VOLUME=100000
POLYMARKET_MAX_MARKETS=10
POLYMARKET_INTERVAL=3600000  # Every hour
```

### Sports Betting Research

```bash
ENABLE_POLYMARKET=true
POLYMARKET_CATEGORIES=sports
POLYMARKET_MIN_VOLUME=25000
POLYMARKET_SHARE_TOP=5
```

## License

MIT
