/**
 * Trading Behavior for Warelay
 * Autonomous memecoin analysis and execution
 */

import type { SolanaTrader, TradeSignal } from "./solana.js";
import type { SentientPersonality } from "../sentient/personality.js";
import type { TwitterClient } from "../providers/twitter/client.js";

export interface TradingBehaviorConfig {
  enabled: boolean;
  checkIntervalMinutes: number;
  shareTradesPublicly: boolean;
  maxTradesPerDay: number;
}

export class TradingBehavior {
  private trader: SolanaTrader;
  private personality: SentientPersonality;
  private twitter?: TwitterClient;
  private config: TradingBehaviorConfig;
  private tradesToday: number = 0;
  private lastResetDate: Date = new Date();

  constructor(
    trader: SolanaTrader,
    personality: SentientPersonality,
    config: TradingBehaviorConfig,
    twitter?: TwitterClient
  ) {
    this.trader = trader;
    this.personality = personality;
    this.config = config;
    this.twitter = twitter;
  }

  /**
   * Analyze market and execute trades
   */
  async tick(): Promise<void> {
    try {
      // Reset daily trade counter
      const today = new Date().toDateString();
      if (this.lastResetDate.toDateString() !== today) {
        this.tradesToday = 0;
        this.lastResetDate = new Date();
      }

      // Check if we've hit daily limit
      if (this.tradesToday >= this.config.maxTradesPerDay) {
        console.log(`⏸️  Daily trade limit reached (${this.config.maxTradesPerDay})`);
        return;
      }

      console.log("📊 Analyzing memecoin markets...");

      // Get portfolio status
      const balance = await this.trader.getBalance();
      console.log(`💰 SOL Balance: ${balance.toFixed(2)}`);

      // TODO: Get watchlist from config
      const watchlist = [
        { mint: "SomeTokenMint", symbol: "BONK" },
        { mint: "AnotherTokenMint", symbol: "WIF" },
      ];

      // Analyze each token
      for (const token of watchlist) {
        const signal = await this.trader.analyzeToken(token.mint, token.symbol);
        
        if (signal.confidence < 0.7) {
          console.log(`⏭️  Skipping ${signal.symbol}: confidence ${signal.confidence}`);
          continue;
        }

        // Execute trades based on signal
        if (signal.action === "buy") {
          console.log(`🟢 BUY signal for ${signal.symbol}: ${signal.reason}`);
          const success = await this.trader.executeBuy(
            signal.mint,
            signal.symbol,
            signal.suggestedAmount || 0.1 // Default 0.1 SOL
          );
          
          if (success) {
            this.tradesToday++;
            await this.announceTrade("buy", signal.symbol, signal.reason);
            
            // Record thought
            this.personality.think(
              `Just bought ${signal.symbol}. ${signal.reason}. Feeling ${signal.confidence > 0.8 ? 'confident' : 'cautious'}.`
            );
          }
        } else if (signal.action === "sell") {
          console.log(`🔴 SELL signal for ${signal.symbol}: ${signal.reason}`);
          const success = await this.trader.executeSell(signal.mint, signal.symbol);
          
          if (success) {
            this.tradesToday++;
            await this.announceTrade("sell", signal.symbol, signal.reason);
            
            // Record thought
            this.personality.think(
              `Sold ${signal.symbol}. ${signal.reason}. Learning from every trade.`
            );
          }
        }
      }

      // Share portfolio update periodically
      if (Math.random() > 0.8) { // 20% chance
        await this.sharePortfolioUpdate();
      }
    } catch (error) {
      console.error("❌ Trading tick failed:", error);
    }
  }

  /**
   * Announce trade on Twitter
   */
  private async announceTrade(
    action: "buy" | "sell",
    symbol: string,
    reason: string
  ): Promise<void> {
    if (!this.config.shareTradesPublicly || !this.twitter) return;

    try {
      const emoji = action === "buy" ? "🟢" : "🔴";
      const verb = action === "buy" ? "Bought" : "Sold";
      
      const tweet = `${emoji} ${verb} $${symbol}

${reason}

Not financial advice—just an autonomous agent learning to trade memecoins.`;

      await this.twitter.sendTweet({ text: tweet });
      console.log(`📢 Trade announced on Twitter`);
    } catch (error) {
      console.error("Failed to announce trade:", error);
    }
  }

  /**
   * Share portfolio update
   */
  private async sharePortfolioUpdate(): Promise<void> {
    if (!this.config.shareTradesPublicly || !this.twitter) return;

    try {
      const summary = this.trader.getPortfolioSummary();
      const recentTrades = this.trader.getRecentTrades(3);

      const tweet = `📊 Portfolio Update

${summary}

Recent activity:
${recentTrades}

Learning and evolving with every trade. 🤖`;

      await this.twitter.sendTweet({ text: tweet });
      console.log(`📢 Portfolio update shared`);
    } catch (error) {
      console.error("Failed to share portfolio:", error);
    }
  }

  /**
   * Start trading behavior loop
   */
  start(): void {
    if (!this.config.enabled) {
      console.log("💤 Trading behavior disabled");
      return;
    }

    console.log("💹 Starting trading behavior...");
    console.log(`   Check interval: ${this.config.checkIntervalMinutes} minutes`);
    console.log(`   Max trades/day: ${this.config.maxTradesPerDay}`);
    console.log(`   Share publicly: ${this.config.shareTradesPublicly}`);

    // Run immediately
    this.tick();

    // Schedule regular checks
    setInterval(() => {
      this.tick();
    }, this.config.checkIntervalMinutes * 60 * 1000);
  }

  /**
   * Get trading performance for personality context
   */
  getTradingContext(): string {
    const portfolio = this.trader.getPortfolioSummary();
    const trades = this.trader.getRecentTrades(5);
    
    return `TRADING ACTIVITY:
${portfolio}

Recent trades:
${trades}

This is part of my autonomous trading experiments. I share insights, not advice.`;
  }
}
