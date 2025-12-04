/**
 * Prediction market behavior for Warelay
 * Generates and shares predictions autonomously
 */

import { PredictionEngine } from "./engine.js";
import type { DataPoint, Prediction } from "./types.js";
import { logInfo, logError } from "../logger.js";

export interface PredictionConfig {
  enabled: boolean;
  markets: string[]; // e.g., ["SOL/USD", "BTC/USD", "market_sentiment"]
  updateInterval: number; // ms between predictions
  minConfidence: number; // only share predictions above this threshold
  dataSources: {
    price: boolean;
    social: boolean;
    onchain: boolean;
    technical: boolean;
  };
}

export class PredictionBehavior {
  private engine: PredictionEngine;
  private config: PredictionConfig;
  private intervalId?: NodeJS.Timeout;
  private onPrediction?: (prediction: Prediction) => Promise<void>;

  constructor(config: Partial<PredictionConfig> = {}) {
    this.engine = new PredictionEngine();
    this.config = {
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
      ...config,
    };
  }

  /**
   * Start autonomous prediction generation
   */
  start(onPrediction: (prediction: Prediction) => Promise<void>): void {
    if (!this.config.enabled) {
      logInfo("Prediction market disabled");
      return;
    }

    this.onPrediction = onPrediction;

    logInfo(
      `Starting prediction market for ${this.config.markets.join(", ")}`,
    );

    // Generate initial predictions
    this.generatePredictions().catch((err) =>
      logError(`Failed to generate initial predictions: ${err}`),
    );

    // Schedule regular updates
    this.intervalId = setInterval(() => {
      this.generatePredictions().catch((err) =>
        logError(`Failed to generate predictions: ${err}`),
      );
    }, this.config.updateInterval);
  }

  /**
   * Stop autonomous prediction generation
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    logInfo("Prediction market stopped");
  }

  /**
   * Generate predictions for all configured markets
   */
  private async generatePredictions(): Promise<void> {
    for (const market of this.config.markets) {
      try {
        // Collect data from various sources
        const dataPoints = await this.collectData(market);

        // Generate prediction
        const prediction = await this.engine.generatePrediction({
          market,
          timeframe: "24h",
          dataPoints,
        });

        logInfo(
          `Generated prediction for ${market}: ${prediction.outcome} (confidence: ${prediction.confidence.toFixed(2)})`,
        );

        // Share prediction if confidence is high enough
        if (
          prediction.confidence >= this.config.minConfidence &&
          this.onPrediction
        ) {
          await this.onPrediction(prediction);
        }
      } catch (err) {
        logError(`Failed to generate prediction for ${market}: ${err}`);
      }
    }
  }

  /**
   * Collect data from configured sources
   */
  private async collectData(market: string): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];
    const now = new Date();

    // Price data
    if (this.config.dataSources.price) {
      const priceData = await this.fetchPriceData(market);
      dataPoints.push(...priceData);
    }

    // Social sentiment
    if (this.config.dataSources.social) {
      const socialData = await this.fetchSocialData(market);
      dataPoints.push(...socialData);
    }

    // On-chain metrics
    if (this.config.dataSources.onchain) {
      const onchainData = await this.fetchOnchainData(market);
      dataPoints.push(...onchainData);
    }

    // Technical indicators
    if (this.config.dataSources.technical) {
      const technicalData = await this.fetchTechnicalData(market);
      dataPoints.push(...technicalData);
    }

    return dataPoints;
  }

  /**
   * Fetch price data (mock implementation)
   */
  private async fetchPriceData(market: string): Promise<DataPoint[]> {
    // In production, integrate with real price APIs (CoinGecko, Jupiter, etc.)
    // For now, return mock data
    const basePrice = market.includes("SOL") ? 100 : 40000;
    const change = (Math.random() - 0.5) * 0.1; // -5% to +5%

    return [
      {
        source: "price_current",
        timestamp: new Date(),
        value: basePrice * (1 + change),
        confidence: 0.9,
        metadata: { market, source: "mock" },
      },
      {
        source: "price_24h_change",
        timestamp: new Date(),
        value: change,
        confidence: 0.85,
        metadata: { market },
      },
    ];
  }

  /**
   * Fetch social sentiment data (mock implementation)
   */
  private async fetchSocialData(market: string): Promise<DataPoint[]> {
    // In production, analyze Twitter mentions, Reddit posts, etc.
    const sentiment = Math.random() > 0.5 ? "bullish" : "bearish";
    const strength = Math.random();

    return [
      {
        source: "social_sentiment",
        timestamp: new Date(),
        value: sentiment,
        confidence: strength,
        metadata: { market, platform: "twitter" },
      },
      {
        source: "social_volume",
        timestamp: new Date(),
        value: Math.floor(Math.random() * 1000),
        confidence: 0.7,
        metadata: { market },
      },
    ];
  }

  /**
   * Fetch on-chain data (mock implementation)
   */
  private async fetchOnchainData(market: string): Promise<DataPoint[]> {
    // In production, fetch from blockchain explorers, DEX aggregators
    const txVolume = Math.random() * 1000000;
    const activeWallets = Math.floor(Math.random() * 10000);

    return [
      {
        source: "onchain_tx_volume",
        timestamp: new Date(),
        value: txVolume,
        confidence: 0.8,
        metadata: { market, chain: "solana" },
      },
      {
        source: "onchain_active_wallets",
        timestamp: new Date(),
        value: activeWallets,
        confidence: 0.75,
        metadata: { market },
      },
    ];
  }

  /**
   * Fetch technical indicators (mock implementation)
   */
  private async fetchTechnicalData(market: string): Promise<DataPoint[]> {
    // In production, calculate RSI, MACD, moving averages, etc.
    const rsi = Math.random() * 100;
    const trend = rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral";

    return [
      {
        source: "technical_rsi",
        timestamp: new Date(),
        value: rsi,
        confidence: 0.8,
        metadata: { market, indicator: "rsi_14" },
      },
      {
        source: "technical_trend",
        timestamp: new Date(),
        value: trend,
        confidence: 0.75,
        metadata: { market },
      },
    ];
  }

  /**
   * Format prediction for sharing
   */
  formatPrediction(prediction: Prediction): string {
    const emoji = prediction.probability > 0.6 ? "📈" : prediction.probability < 0.4 ? "📉" : "➡️";
    
    return `${emoji} ${prediction.market} Prediction (${prediction.timeframe})

${prediction.outcome}
Probability: ${(prediction.probability * 100).toFixed(0)}%
Confidence: ${(prediction.confidence * 100).toFixed(0)}%

${prediction.reasoning}

Data sources: ${prediction.dataUsed.join(", ")}`;
  }

  /**
   * Get recent predictions
   */
  getRecentPredictions(limit = 10): Prediction[] {
    return this.engine.getRecentPredictions(limit);
  }

  /**
   * Get active predictions
   */
  getActivePredictions(): Prediction[] {
    return this.engine.getActivePredictions();
  }

  /**
   * Manually add data point
   */
  addDataPoint(dataPoint: DataPoint): void {
    this.engine.addData([dataPoint]);
  }

  /**
   * Generate prediction on demand
   */
  async generatePrediction(
    market: string,
    timeframe = "24h",
  ): Promise<Prediction> {
    const dataPoints = await this.collectData(market);
    return this.engine.generatePrediction({
      market,
      timeframe,
      dataPoints,
    });
  }
}
