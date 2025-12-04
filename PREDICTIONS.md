# Warelay Prediction Market

Warelay's autonomous prediction market system that generates market forecasts based on multiple data sources.

## Overview

The prediction market analyzes data from various sources to generate probabilistic predictions about market movements, price trends, and other events. It combines technical analysis, social sentiment, on-chain metrics, and other signals to produce high-confidence predictions.

## Features

- **Multi-Source Analysis**: Aggregates data from price feeds, social media, blockchain metrics, and technical indicators
- **Weighted Predictions**: Assigns confidence scores based on data quality and signal alignment
- **Autonomous Sharing**: Automatically tweets high-confidence predictions
- **Historical Tracking**: Maintains prediction history for accuracy analysis
- **Configurable Markets**: Support for multiple markets (SOL/USD, BTC/USD, etc.)

## Architecture

```
┌─────────────────┐
│  Data Sources   │
│ - Price feeds   │
│ - Social media  │
│ - On-chain data │
│ - Technical     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Aggregator │
│ - Normalize     │
│ - Weight        │
│ - Filter        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Prediction      │
│ Engine          │
│ - Analyze       │
│ - Calculate     │
│ - Reason        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prediction     │
│ - Outcome       │
│ - Probability   │
│ - Confidence    │
│ - Reasoning     │
└─────────────────┘
```

## Configuration

### Environment Variables

```bash
# Enable/disable predictions
ENABLE_PREDICTIONS=true

# Markets to analyze (comma-separated)
PREDICTION_MARKETS=SOL/USD,BTC/USD,ETH/USD

# Update interval in milliseconds (default: 1 hour)
PREDICTION_INTERVAL=3600000

# Minimum confidence to share publicly (0-1)
MIN_PREDICTION_CONFIDENCE=0.6
```

### Prediction Config

```typescript
const predictions = new PredictionBehavior({
  enabled: true,
  markets: ["SOL/USD", "BTC/USD"],
  updateInterval: 60 * 60 * 1000, // 1 hour
  minConfidence: 0.6,
  dataSources: {
    price: true,
    social: true,
    onchain: true,
    technical: true,
  },
});
```

## Usage

### Starting the Prediction Market

```bash
# In your .env file
ENABLE_PREDICTIONS=true
PREDICTION_MARKETS=SOL/USD,BTC/USD
PREDICTION_INTERVAL=3600000
MIN_PREDICTION_CONFIDENCE=0.7

# Run Warelay with predictions enabled
npm run sentient
```

### Manual Prediction Generation

```typescript
import { PredictionBehavior } from "./predictions/index.js";

const predictions = new PredictionBehavior({
  enabled: true,
  markets: ["SOL/USD"],
});

// Generate prediction on demand
const prediction = await predictions.generatePrediction(
  "SOL/USD",
  "24h"
);

console.log(prediction.outcome);
console.log(`Probability: ${prediction.probability * 100}%`);
console.log(`Confidence: ${prediction.confidence * 100}%`);
```

### Adding Custom Data Points

```typescript
import type { DataPoint } from "./predictions/types.js";

const dataPoint: DataPoint = {
  source: "custom_indicator",
  timestamp: new Date(),
  value: 0.75, // Numeric value
  confidence: 0.9,
  metadata: {
    indicator: "custom_rsi",
    market: "SOL/USD",
  },
};

predictions.addDataPoint(dataPoint);
```

## Data Sources

### 1. Price Data
- Current prices
- Historical price movements
- 24h change percentages
- Volume metrics

### 2. Social Sentiment
- Twitter mentions and sentiment
- Reddit discussions
- Social volume and engagement
- Influencer signals

### 3. On-Chain Metrics
- Transaction volume
- Active wallet counts
- Token holder distribution
- DEX activity

### 4. Technical Indicators
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Moving averages
- Support/resistance levels

## Prediction Format

Predictions contain:

```typescript
{
  market: "SOL/USD",
  timeframe: "24h",
  outcome: "SOL/USD will trend upward",
  probability: 0.72,       // 0-1 (72% likely)
  confidence: 0.85,        // 0-1 (85% confident)
  reasoning: "Technical indicators show positive momentum. Social sentiment is bullish. On-chain activity is increasing.",
  dataUsed: ["technical", "social", "onchain"],
  timestamp: Date,
  expiresAt: Date
}
```

## Output Examples

### High Confidence Prediction
```
📈 SOL/USD Prediction (24h)

SOL/USD will trend upward
Probability: 75%
Confidence: 88%

Technical indicators show positive momentum. Social sentiment is bullish. On-chain activity is increasing. Key factors: technical: strong bullish signal, social_sentiment: bullish

Data sources: technical, social, onchain
```

### Medium Confidence Prediction
```
➡️ BTC/USD Prediction (24h)

BTC/USD will remain stable
Probability: 60%
Confidence: 65%

Technical indicators show neutral signals. Social sentiment is mixed. Low volatility suggests stability.

Data sources: technical, social, price
```

## API

### PredictionEngine

```typescript
// Generate prediction
const prediction = await engine.generatePrediction({
  market: "SOL/USD",
  timeframe: "24h",
  dataPoints: [...]
});

// Get recent predictions
const recent = engine.getRecentPredictions(10);

// Get active predictions
const active = engine.getActivePredictions();

// Calculate accuracy
const accuracy = engine.calculateAccuracy(actualOutcomes);
```

### PredictionBehavior

```typescript
// Start autonomous predictions
predictions.start(async (prediction) => {
  console.log("New prediction:", prediction.outcome);
});

// Stop predictions
predictions.stop();

// Get predictions
const recent = predictions.getRecentPredictions(10);
const active = predictions.getActivePredictions();

// Format for sharing
const formatted = predictions.formatPrediction(prediction);
```

## Integration with Trading

Predictions can inform trading decisions:

```typescript
// Generate prediction
const prediction = await predictions.generatePrediction("SOL/USD", "1h");

// Use prediction for trading
if (prediction.probability > 0.7 && prediction.confidence > 0.8) {
  if (prediction.outcome.includes("upward")) {
    await trader.buy("SOL", amount);
  }
}
```

## Data Integration

### Adding Real Data Sources

Replace mock implementations with real APIs:

```typescript
// Example: CoinGecko price data
async fetchPriceData(market: string): Promise<DataPoint[]> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${market}&vs_currencies=usd&include_24hr_change=true`
  );
  const data = await response.json();
  
  return [{
    source: "coingecko_price",
    timestamp: new Date(),
    value: data[market].usd,
    confidence: 0.95,
    metadata: { 
      change24h: data[market].usd_24h_change 
    }
  }];
}
```

### Twitter Sentiment Analysis

```typescript
// Example: Analyze Twitter sentiment
async fetchSocialData(market: string): Promise<DataPoint[]> {
  const tweets = await twitterClient.search({
    query: `${market} (bull OR bear OR pump OR dump)`,
    max_results: 100
  });
  
  const sentiment = analyzeSentiment(tweets);
  
  return [{
    source: "twitter_sentiment",
    timestamp: new Date(),
    value: sentiment, // "bullish" | "bearish" | "neutral"
    confidence: 0.7,
    metadata: { 
      tweet_count: tweets.length 
    }
  }];
}
```

## Best Practices

1. **Data Quality**: Use high-confidence data sources
2. **Signal Diversity**: Combine multiple independent signals
3. **Timeframe Alignment**: Match prediction timeframe to data recency
4. **Confidence Thresholds**: Only share high-confidence predictions publicly
5. **Historical Tracking**: Monitor prediction accuracy over time
6. **Regular Updates**: Keep data fresh with appropriate intervals

## Testing

```bash
# Run prediction tests
npm test -- predictions

# Test with mock data
npm run sentient
```

## Troubleshooting

### Low Confidence Predictions
- Increase data source diversity
- Use higher-quality data feeds
- Extend data collection timeframe

### Conflicting Signals
- Check data source reliability
- Adjust confidence weighting
- Increase minimum confidence threshold

### No Predictions Generated
- Verify data sources are working
- Check ENABLE_PREDICTIONS setting
- Review prediction interval timing

## Future Enhancements

- [ ] Real-time data streaming
- [ ] Machine learning prediction models
- [ ] Prediction accuracy tracking dashboard
- [ ] Community prediction voting
- [ ] Multi-asset correlation analysis
- [ ] Custom indicator plugins
- [ ] Prediction marketplace integration

## License

MIT
