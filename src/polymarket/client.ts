/**
 * Polymarket API client
 * Fetches real-time prediction market data
 */

import type { PolymarketMarket, PolymarketEvent } from "./types.js";

export class PolymarketClient {
  private readonly baseUrl = "https://gamma-api.polymarket.com";
  private readonly clob = "https://clob.polymarket.com";

  /**
   * Get trending markets
   */
  async getTrendingMarkets(limit = 10): Promise<PolymarketMarket[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/markets?limit=${limit}&active=true&closed=false`,
      );
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch trending markets:", error);
      return [];
    }
  }

  /**
   * Get markets by category
   */
  async getMarketsByCategory(
    category: string,
    limit = 10,
  ): Promise<PolymarketMarket[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/markets?category=${encodeURIComponent(category)}&limit=${limit}&active=true`,
      );
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${category} markets:`, error);
      return [];
    }
  }

  /**
   * Search markets by keyword
   */
  async searchMarkets(query: string): Promise<PolymarketMarket[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/markets?search=${encodeURIComponent(query)}&active=true`,
      );
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to search markets for "${query}":`, error);
      return [];
    }
  }

  /**
   * Get specific market by ID
   */
  async getMarket(marketId: string): Promise<PolymarketMarket | null> {
    try {
      const response = await fetch(`${this.baseUrl}/markets/${marketId}`);
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch market ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Get market events
   */
  async getEvents(limit = 20): Promise<PolymarketEvent[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/events?limit=${limit}&active=true`,
      );
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  }

  /**
   * Get high-volume markets (most active)
   */
  async getHighVolumeMarkets(limit = 10): Promise<PolymarketMarket[]> {
    try {
      const markets = await this.getTrendingMarkets(50);
      return markets
        .sort((a, b) => (b.volume || 0) - (a.volume || 0))
        .slice(0, limit);
    } catch (error) {
      console.error("Failed to fetch high-volume markets:", error);
      return [];
    }
  }

  /**
   * Get markets by tags
   */
  async getMarketsByTags(tags: string[]): Promise<PolymarketMarket[]> {
    try {
      const allMarkets = await this.getTrendingMarkets(100);
      return allMarkets.filter((market) =>
        tags.some(
          (tag) =>
            market.tags?.some((t) =>
              t.toLowerCase().includes(tag.toLowerCase()),
            ),
        ),
      );
    } catch (error) {
      console.error("Failed to fetch markets by tags:", error);
      return [];
    }
  }

  /**
   * Get markets closing soon
   */
  async getClosingSoonMarkets(
    hoursAhead = 24,
  ): Promise<PolymarketMarket[]> {
    try {
      const markets = await this.getTrendingMarkets(100);
      const cutoff = Date.now() + hoursAhead * 60 * 60 * 1000;

      return markets
        .filter((m) => {
          if (!m.endDate) return false;
          const endTime = new Date(m.endDate).getTime();
          return endTime <= cutoff && endTime > Date.now();
        })
        .sort(
          (a, b) =>
            new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
        );
    } catch (error) {
      console.error("Failed to fetch closing soon markets:", error);
      return [];
    }
  }

  /**
   * Format market for display
   */
  formatMarket(market: PolymarketMarket): string {
    const odds = market.outcomePrices?.[0]
      ? `${(market.outcomePrices[0] * 100).toFixed(1)}%`
      : "N/A";
    const volume = market.volume
      ? `$${(market.volume / 1000).toFixed(0)}K`
      : "N/A";

    return `${market.question}
Odds: ${odds} | Volume: ${volume}
Outcomes: ${market.outcomes?.join(" vs ") || "Unknown"}`;
  }
}
