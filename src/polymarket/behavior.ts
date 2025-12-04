/**
 * Autonomous Polymarket prediction behavior
 * Regularly analyzes markets and shares Claude's predictions
 */

import { PolymarketClient } from "./client.js";
import { ClaudeAnalyzer } from "./claude-analyzer.js";
import type {
  PolymarketMarket,
  PolymarketPrediction,
} from "./types.js";
import { logInfo, logError } from "../logger.js";

export interface PolymarketConfig {
  enabled: boolean;
  updateInterval: number; // ms between analyses
  categories: string[]; // Categories to focus on
  minVolume: number; // Minimum volume to consider
  maxMarketsPerUpdate: number; // Max markets to analyze each update
  shareTopN: number; // Share top N predictions publicly
  focusTags?: string[]; // Optional tags to filter by
}

export class PolymarketBehavior {
  private client: PolymarketClient;
  private analyzer: ClaudeAnalyzer;
  private config: PolymarketConfig;
  private intervalId?: NodeJS.Timeout;
  private onPrediction?: (
    prediction: PolymarketPrediction,
  ) => Promise<void>;
  private lastAnalyzedMarkets: Set<string> = new Set();

  constructor(
    config: Partial<PolymarketConfig> = {},
    claudeCommand?: string[],
  ) {
    this.client = new PolymarketClient();
    this.analyzer = new ClaudeAnalyzer(claudeCommand);
    this.config = {
      enabled: true,
      updateInterval: 2 * 60 * 60 * 1000, // 2 hours
      categories: ["crypto", "politics", "sports", "science"],
      minVolume: 10000, // $10K minimum
      maxMarketsPerUpdate: 5,
      shareTopN: 3,
      ...config,
    };
  }

  /**
   * Start autonomous market analysis
   */
  start(
    onPrediction: (prediction: PolymarketPrediction) => Promise<void>,
  ): void {
    if (!this.config.enabled) {
      logInfo("Polymarket predictions disabled");
      return;
    }

    this.onPrediction = onPrediction;

    logInfo(
      `Starting Polymarket analysis (categories: ${this.config.categories.join(", ")})`,
    );

    // Analyze immediately
    this.analyzeMarkets().catch((err) =>
      logError(`Failed to analyze Polymarket markets: ${err}`),
    );

    // Schedule regular updates
    this.intervalId = setInterval(() => {
      this.analyzeMarkets().catch((err) =>
        logError(`Failed to analyze Polymarket markets: ${err}`),
      );
    }, this.config.updateInterval);
  }

  /**
   * Stop autonomous analysis
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    logInfo("Polymarket analysis stopped");
  }

  /**
   * Analyze interesting markets
   */
  private async analyzeMarkets(): Promise<void> {
    try {
      // Get interesting markets
      const markets = await this.getInterestingMarkets();

      if (markets.length === 0) {
        logInfo("No interesting markets found");
        return;
      }

      logInfo(`Analyzing ${markets.length} Polymarket markets with Claude`);

      // Analyze with Claude
      const predictions =
        await this.analyzer.analyzeMultipleMarkets(markets);

      // Share top predictions
      const topPredictions = predictions.slice(0, this.config.shareTopN);

      for (const prediction of topPredictions) {
        if (this.shouldSharePrediction(prediction)) {
          await this.sharePrediction(prediction);
        }
      }

      // Track analyzed markets
      for (const market of markets) {
        this.lastAnalyzedMarkets.add(market.id);
      }

      // Cleanup old tracking (keep last 1000)
      if (this.lastAnalyzedMarkets.size > 1000) {
        const arr = Array.from(this.lastAnalyzedMarkets);
        this.lastAnalyzedMarkets = new Set(arr.slice(-500));
      }
    } catch (error) {
      logError(`Market analysis failed: ${error}`);
    }
  }

  /**
   * Get interesting markets to analyze
   */
  private async getInterestingMarkets(): Promise<PolymarketMarket[]> {
    const allMarkets: PolymarketMarket[] = [];

    // Get high-volume markets
    const highVolume = await this.client.getHighVolumeMarkets(20);
    allMarkets.push(...highVolume);

    // Get markets by categories
    for (const category of this.config.categories) {
      const categoryMarkets =
        await this.client.getMarketsByCategory(category, 10);
      allMarkets.push(...categoryMarkets);
    }

    // Get markets by tags if configured
    if (this.config.focusTags && this.config.focusTags.length > 0) {
      const tagMarkets = await this.client.getMarketsByTags(
        this.config.focusTags,
      );
      allMarkets.push(...tagMarkets);
    }

    // Deduplicate and filter
    const uniqueMarkets = Array.from(
      new Map(allMarkets.map((m) => [m.id, m])).values(),
    );

    return (
      uniqueMarkets
        // Filter by volume
        .filter((m) => (m.volume || 0) >= this.config.minVolume)
        // Filter out recently analyzed
        .filter((m) => !this.lastAnalyzedMarkets.has(m.id))
        // Filter active markets
        .filter((m) => m.active !== false)
        // Sort by volume
        .sort((a, b) => (b.volume || 0) - (a.volume || 0))
        // Limit
        .slice(0, this.config.maxMarketsPerUpdate)
    );
  }

  /**
   * Should we share this prediction publicly?
   */
  private shouldSharePrediction(
    prediction: PolymarketPrediction,
  ): boolean {
    const { claudeAnalysis } = prediction;

    // Must have high confidence
    if (claudeAnalysis.confidence < 0.65) {
      return false;
    }

    // Must have a clear recommendation
    if (claudeAnalysis.recommendedAction === "hold") {
      return false;
    }

    // Prefer disagreements with market (value opportunities)
    if (claudeAnalysis.marketOpinion === "disagree") {
      return true;
    }

    // Share if very high confidence even if agreeing
    if (
      claudeAnalysis.confidence > 0.8 &&
      claudeAnalysis.riskLevel !== "high"
    ) {
      return true;
    }

    return false;
  }

  /**
   * Share prediction publicly
   */
  private async sharePrediction(
    prediction: PolymarketPrediction,
  ): Promise<void> {
    if (!this.onPrediction) return;

    try {
      logInfo(
        `Sharing Polymarket prediction: ${prediction.market.question.substring(0, 50)}...`,
      );
      await this.onPrediction(prediction);
    } catch (error) {
      logError(`Failed to share prediction: ${error}`);
    }
  }

  /**
   * Manually analyze a specific market
   */
  async analyzeSingleMarket(
    marketId: string,
  ): Promise<PolymarketPrediction | null> {
    const market = await this.client.getMarket(marketId);
    if (!market) {
      return null;
    }

    const analysis = await this.analyzer.analyzeMarket(market);

    return {
      market,
      claudeAnalysis: analysis,
      currentOdds: market.outcomePrices?.[0] || 0.5,
      timestamp: new Date(),
    };
  }

  /**
   * Search and analyze markets by keyword
   */
  async searchAndAnalyze(
    query: string,
  ): Promise<PolymarketPrediction[]> {
    const markets = await this.client.searchMarkets(query);
    const filtered = markets
      .filter((m) => (m.volume || 0) >= this.config.minVolume)
      .slice(0, 5);

    return await this.analyzer.analyzeMultipleMarkets(filtered);
  }

  /**
   * Get trending predictions
   */
  async getTrendingPredictions(): Promise<PolymarketPrediction[]> {
    const markets = await this.client.getTrendingMarkets(10);
    return await this.analyzer.analyzeMultipleMarkets(markets);
  }

  /**
   * Format prediction for sharing
   */
  formatPrediction(prediction: PolymarketPrediction): string {
    return this.analyzer.formatPrediction(prediction);
  }
}
