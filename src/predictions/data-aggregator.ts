/**
 * Data aggregation for prediction market
 * Collects and normalizes data from multiple sources
 */

import type { DataPoint, DataSource } from "./types.js";

export class DataAggregator {
  private dataPoints: Map<DataSource, DataPoint[]> = new Map();

  /**
   * Add a data point from a specific source
   */
  addDataPoint(source: DataSource, dataPoint: DataPoint): void {
    if (!this.dataPoints.has(source)) {
      this.dataPoints.set(source, []);
    }
    this.dataPoints.get(source)?.push(dataPoint);
  }

  /**
   * Get all data points for a source
   */
  getDataPoints(source: DataSource): DataPoint[] {
    return this.dataPoints.get(source) || [];
  }

  /**
   * Get all data points from all sources
   */
  getAllDataPoints(): DataPoint[] {
    const all: DataPoint[] = [];
    for (const points of this.dataPoints.values()) {
      all.push(...points);
    }
    return all;
  }

  /**
   * Get recent data points within timeframe
   */
  getRecentDataPoints(
    timeframeMs: number,
    sources?: DataSource[],
  ): DataPoint[] {
    const cutoff = Date.now() - timeframeMs;
    const sourcesToCheck = sources || Array.from(this.dataPoints.keys());

    const recent: DataPoint[] = [];
    for (const source of sourcesToCheck) {
      const points = this.dataPoints.get(source) || [];
      recent.push(
        ...points.filter((p) => p.timestamp.getTime() > cutoff),
      );
    }

    return recent.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Calculate weighted average of numeric data points
   */
  calculateWeightedAverage(dataPoints: DataPoint[]): number {
    if (dataPoints.length === 0) return 0;

    const numericPoints = dataPoints.filter(
      (p) => typeof p.value === "number",
    );
    if (numericPoints.length === 0) return 0;

    const totalWeight = numericPoints.reduce(
      (sum, p) => sum + p.confidence,
      0,
    );
    const weightedSum = numericPoints.reduce(
      (sum, p) => sum + (p.value as number) * p.confidence,
      0,
    );

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate sentiment score from boolean/string data points
   */
  calculateSentiment(dataPoints: DataPoint[]): number {
    if (dataPoints.length === 0) return 0;

    let positiveWeight = 0;
    let negativeWeight = 0;

    for (const point of dataPoints) {
      if (typeof point.value === "boolean") {
        if (point.value) {
          positiveWeight += point.confidence;
        } else {
          negativeWeight += point.confidence;
        }
      } else if (typeof point.value === "string") {
        const sentiment = this.classifySentiment(point.value);
        if (sentiment > 0) {
          positiveWeight += sentiment * point.confidence;
        } else {
          negativeWeight += Math.abs(sentiment) * point.confidence;
        }
      }
    }

    const total = positiveWeight + negativeWeight;
    return total > 0 ? (positiveWeight - negativeWeight) / total : 0;
  }

  /**
   * Simple sentiment classification for text
   */
  private classifySentiment(text: string): number {
    const positive = [
      "bullish",
      "pump",
      "moon",
      "up",
      "gain",
      "buy",
      "strong",
      "growth",
    ];
    const negative = [
      "bearish",
      "dump",
      "down",
      "loss",
      "sell",
      "weak",
      "crash",
      "drop",
    ];

    const lower = text.toLowerCase();
    let score = 0;

    for (const word of positive) {
      if (lower.includes(word)) score += 0.2;
    }
    for (const word of negative) {
      if (lower.includes(word)) score -= 0.2;
    }

    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Clear old data points
   */
  clearOldData(olderThanMs: number): void {
    const cutoff = Date.now() - olderThanMs;

    for (const [source, points] of this.dataPoints.entries()) {
      const recent = points.filter(
        (p) => p.timestamp.getTime() > cutoff,
      );
      this.dataPoints.set(source, recent);
    }
  }

  /**
   * Get data summary statistics
   */
  getSummary(): {
    totalPoints: number;
    bySource: Record<string, number>;
    oldestPoint: Date | null;
    newestPoint: Date | null;
  } {
    const all = this.getAllDataPoints();
    const bySource: Record<string, number> = {};

    for (const [source, points] of this.dataPoints.entries()) {
      bySource[source] = points.length;
    }

    const timestamps = all.map((p) => p.timestamp.getTime());

    return {
      totalPoints: all.length,
      bySource,
      oldestPoint:
        timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestPoint:
        timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null,
    };
  }
}
