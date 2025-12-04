/**
 * Prediction engine that generates market predictions
 * from aggregated data points
 */

import { DataAggregator } from "./data-aggregator.js";
import type {
  DataPoint,
  MarketAnalysis,
  Prediction,
  PredictionInput,
} from "./types.js";

export class PredictionEngine {
  private aggregator: DataAggregator;
  private predictions: Prediction[] = [];

  constructor() {
    this.aggregator = new DataAggregator();
  }

  /**
   * Add data points to the engine
   */
  addData(dataPoints: DataPoint[]): void {
    for (const point of dataPoints) {
      const source = this.classifySource(point.source);
      this.aggregator.addDataPoint(source, point);
    }
  }

  /**
   * Generate a prediction based on current data
   */
  async generatePrediction(
    input: PredictionInput,
  ): Promise<Prediction> {
    // Add new data points
    this.addData(input.dataPoints);

    // Analyze the market
    const analysis = this.analyzeMarket(
      input.market,
      input.timeframe,
    );

    // Generate prediction
    const prediction = this.createPrediction(
      input.market,
      input.timeframe,
      analysis,
    );

    // Store prediction
    this.predictions.push(prediction);

    // Clean up old data (keep last 7 days)
    this.aggregator.clearOldData(7 * 24 * 60 * 60 * 1000);

    return prediction;
  }

  /**
   * Analyze market conditions
   */
  private analyzeMarket(
    market: string,
    timeframe: string,
  ): MarketAnalysis {
    const timeframeMs = this.parseTimeframe(timeframe);
    const recentData =
      this.aggregator.getRecentDataPoints(timeframeMs);

    // Calculate signals from different data sources
    const technicalData = recentData.filter((p) =>
      p.source.toLowerCase().includes("technical"),
    );
    const socialData = recentData.filter((p) =>
      p.source.toLowerCase().includes("social"),
    );
    const onchainData = recentData.filter((p) =>
      p.source.toLowerCase().includes("onchain"),
    );

    const technical = this.aggregator.calculateSentiment(technicalData);
    const social = this.aggregator.calculateSentiment(socialData);
    const onchain = this.aggregator.calculateSentiment(onchainData);

    // Calculate overall momentum and sentiment
    const momentum = (technical + social + onchain) / 3;
    const sentiment =
      momentum > 0.2 ? "bullish" : momentum < -0.2 ? "bearish" : "neutral";

    // Calculate volatility from recent price movements
    const priceData = recentData.filter(
      (p) =>
        typeof p.value === "number" && p.source.toLowerCase().includes("price"),
    );
    const volatility = this.calculateVolatility(priceData);

    // Identify key factors
    const keyFactors = this.identifyKeyFactors(
      recentData,
      { technical, social, onchain },
    );

    return {
      market,
      sentiment,
      momentum,
      volatility,
      signals: { technical, social, onchain },
      keyFactors,
    };
  }

  /**
   * Create a prediction from market analysis
   */
  private createPrediction(
    market: string,
    timeframe: string,
    analysis: MarketAnalysis,
  ): Prediction {
    const now = new Date();
    const timeframeMs = this.parseTimeframe(timeframe);

    // Determine outcome based on analysis
    let outcome: string;
    let probability: number;

    if (analysis.sentiment === "bullish") {
      outcome = `${market} will trend upward`;
      probability = 0.5 + Math.abs(analysis.momentum) * 0.4;
    } else if (analysis.sentiment === "bearish") {
      outcome = `${market} will trend downward`;
      probability = 0.5 + Math.abs(analysis.momentum) * 0.4;
    } else {
      outcome = `${market} will remain stable`;
      probability = 0.6;
    }

    // Calculate confidence based on signal alignment
    const signalValues = Object.values(analysis.signals);
    const signalAlignment = this.calculateAlignment(signalValues);
    const confidence = signalAlignment * (1 - analysis.volatility * 0.3);

    // Generate reasoning
    const reasoning = this.generateReasoning(analysis);

    // Data sources used
    const dataUsed = analysis.keyFactors.map((f) =>
      f.split(":")[0],
    );

    return {
      market,
      timeframe,
      outcome,
      probability: Math.min(0.95, Math.max(0.05, probability)),
      confidence: Math.min(0.95, Math.max(0.05, confidence)),
      reasoning,
      dataUsed: [...new Set(dataUsed)],
      timestamp: now,
      expiresAt: new Date(now.getTime() + timeframeMs),
    };
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(analysis: MarketAnalysis): string {
    const reasons: string[] = [];

    // Technical analysis
    if (Math.abs(analysis.signals.technical) > 0.3) {
      const direction =
        analysis.signals.technical > 0 ? "positive" : "negative";
      reasons.push(`Technical indicators show ${direction} momentum`);
    }

    // Social sentiment
    if (Math.abs(analysis.signals.social) > 0.3) {
      const sentiment =
        analysis.signals.social > 0 ? "bullish" : "bearish";
      reasons.push(`Social sentiment is ${sentiment}`);
    }

    // On-chain activity
    if (Math.abs(analysis.signals.onchain) > 0.3) {
      const activity =
        analysis.signals.onchain > 0 ? "increasing" : "decreasing";
      reasons.push(`On-chain activity is ${activity}`);
    }

    // Volatility
    if (analysis.volatility > 0.6) {
      reasons.push("High volatility increases uncertainty");
    } else if (analysis.volatility < 0.3) {
      reasons.push("Low volatility suggests stability");
    }

    // Key factors
    if (analysis.keyFactors.length > 0) {
      reasons.push(
        `Key factors: ${analysis.keyFactors.slice(0, 2).join(", ")}`,
      );
    }

    return reasons.join(". ") + ".";
  }

  /**
   * Calculate volatility from price data
   */
  private calculateVolatility(priceData: DataPoint[]): number {
    if (priceData.length < 2) return 0.5;

    const prices = priceData
      .filter((p) => typeof p.value === "number")
      .map((p) => p.value as number);

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance =
      prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to 0-1 range (coefficient of variation)
    return Math.min(1, stdDev / mean);
  }

  /**
   * Calculate alignment between signals (-1 to 1)
   */
  private calculateAlignment(signals: number[]): number {
    if (signals.length === 0) return 0;

    const avg = signals.reduce((sum, s) => sum + s, 0) / signals.length;
    const deviations = signals.map((s) => Math.abs(s - avg));
    const avgDeviation =
      deviations.reduce((sum, d) => sum + d, 0) / deviations.length;

    // Higher alignment = lower deviation
    return 1 - Math.min(1, avgDeviation);
  }

  /**
   * Identify key factors driving the prediction
   */
  private identifyKeyFactors(
    dataPoints: DataPoint[],
    signals: { technical: number; social: number; onchain: number },
  ): string[] {
    const factors: string[] = [];

    // Find strongest signal
    const strongest = Object.entries(signals).sort(
      ([, a], [, b]) => Math.abs(b) - Math.abs(a),
    )[0];
    if (strongest && Math.abs(strongest[1]) > 0.3) {
      factors.push(`${strongest[0]}: strong ${strongest[1] > 0 ? "bullish" : "bearish"} signal`);
    }

    // Find high-confidence data points
    const highConfidence = dataPoints
      .filter((p) => p.confidence > 0.8)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    for (const point of highConfidence) {
      factors.push(`${point.source}: ${point.value}`);
    }

    return factors;
  }

  /**
   * Classify data point source
   */
  private classifySource(source: string): any {
    const lower = source.toLowerCase();
    if (
      lower.includes("price") ||
      lower.includes("technical") ||
      lower.includes("indicator")
    ) {
      return "technical";
    }
    if (
      lower.includes("twitter") ||
      lower.includes("social") ||
      lower.includes("sentiment")
    ) {
      return "social";
    }
    if (
      lower.includes("onchain") ||
      lower.includes("blockchain") ||
      lower.includes("transaction")
    ) {
      return "onchain";
    }
    if (lower.includes("volume")) return "volume";
    if (lower.includes("news")) return "news";
    return "technical";
  }

  /**
   * Parse timeframe string to milliseconds
   */
  private parseTimeframe(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([mhd])$/);
    if (!match) return 60 * 60 * 1000; // default 1h

    const [, amount, unit] = match;
    const num = Number.parseInt(amount);

    switch (unit) {
      case "m":
        return num * 60 * 1000;
      case "h":
        return num * 60 * 60 * 1000;
      case "d":
        return num * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }

  /**
   * Get recent predictions
   */
  getRecentPredictions(limit = 10): Prediction[] {
    return this.predictions
      .sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      )
      .slice(0, limit);
  }

  /**
   * Get active predictions (not yet expired)
   */
  getActivePredictions(): Prediction[] {
    const now = Date.now();
    return this.predictions.filter(
      (p) => p.expiresAt.getTime() > now,
    );
  }

  /**
   * Calculate prediction accuracy
   */
  calculateAccuracy(
    actualOutcomes: Map<string, boolean>,
  ): {
    accuracy: number;
    total: number;
    correct: number;
  } {
    let correct = 0;
    let total = 0;

    for (const prediction of this.predictions) {
      const key = `${prediction.market}_${prediction.timestamp.getTime()}`;
      const actual = actualOutcomes.get(key);

      if (actual !== undefined) {
        total++;
        if (actual) correct++;
      }
    }

    return {
      accuracy: total > 0 ? correct / total : 0,
      total,
      correct,
    };
  }
}
