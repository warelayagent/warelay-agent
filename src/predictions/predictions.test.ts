/**
 * Test suite for prediction market functionality
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DataAggregator } from "./data-aggregator.js";
import { PredictionEngine } from "./engine.js";
import { PredictionBehavior } from "./behavior.js";
import type { DataPoint } from "./types.js";

describe("DataAggregator", () => {
  let aggregator: DataAggregator;

  beforeEach(() => {
    aggregator = new DataAggregator();
  });

  it("should add and retrieve data points", () => {
    const dataPoint: DataPoint = {
      source: "test_source",
      timestamp: new Date(),
      value: 100,
      confidence: 0.9,
    };

    aggregator.addDataPoint("price", dataPoint);
    const points = aggregator.getDataPoints("price");

    expect(points).toHaveLength(1);
    expect(points[0]).toEqual(dataPoint);
  });

  it("should calculate weighted average correctly", () => {
    const points: DataPoint[] = [
      {
        source: "source1",
        timestamp: new Date(),
        value: 100,
        confidence: 0.8,
      },
      {
        source: "source2",
        timestamp: new Date(),
        value: 200,
        confidence: 0.6,
      },
    ];

    aggregator.addDataPoint("price", points[0]);
    aggregator.addDataPoint("price", points[1]);

    const avg = aggregator.calculateWeightedAverage(points);
    const expected = (100 * 0.8 + 200 * 0.6) / (0.8 + 0.6);

    expect(avg).toBeCloseTo(expected);
  });

  it("should calculate sentiment from boolean values", () => {
    const points: DataPoint[] = [
      {
        source: "signal1",
        timestamp: new Date(),
        value: true,
        confidence: 0.9,
      },
      {
        source: "signal2",
        timestamp: new Date(),
        value: false,
        confidence: 0.5,
      },
    ];

    for (const point of points) {
      aggregator.addDataPoint("social", point);
    }

    const sentiment = aggregator.calculateSentiment(points);
    expect(sentiment).toBeGreaterThan(0); // More positive than negative
  });

  it("should clear old data", () => {
    const oldPoint: DataPoint = {
      source: "old",
      timestamp: new Date(Date.now() - 10000),
      value: 100,
      confidence: 0.8,
    };

    const newPoint: DataPoint = {
      source: "new",
      timestamp: new Date(),
      value: 200,
      confidence: 0.8,
    };

    aggregator.addDataPoint("price", oldPoint);
    aggregator.addDataPoint("price", newPoint);

    aggregator.clearOldData(5000); // Clear data older than 5s

    const points = aggregator.getDataPoints("price");
    expect(points).toHaveLength(1);
    expect(points[0].source).toBe("new");
  });
});

describe("PredictionEngine", () => {
  let engine: PredictionEngine;

  beforeEach(() => {
    engine = new PredictionEngine();
  });

  it("should generate a prediction", async () => {
    const dataPoints: DataPoint[] = [
      {
        source: "technical_rsi",
        timestamp: new Date(),
        value: 65,
        confidence: 0.8,
      },
      {
        source: "social_sentiment",
        timestamp: new Date(),
        value: "bullish",
        confidence: 0.7,
      },
    ];

    const prediction = await engine.generatePrediction({
      market: "SOL/USD",
      timeframe: "24h",
      dataPoints,
    });

    expect(prediction.market).toBe("SOL/USD");
    expect(prediction.timeframe).toBe("24h");
    expect(prediction.probability).toBeGreaterThanOrEqual(0);
    expect(prediction.probability).toBeLessThanOrEqual(1);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
    expect(prediction.outcome).toBeTruthy();
    expect(prediction.reasoning).toBeTruthy();
  });

  it("should track predictions", async () => {
    const dataPoints: DataPoint[] = [
      {
        source: "price",
        timestamp: new Date(),
        value: 100,
        confidence: 0.9,
      },
    ];

    await engine.generatePrediction({
      market: "SOL/USD",
      timeframe: "1h",
      dataPoints,
    });

    await engine.generatePrediction({
      market: "BTC/USD",
      timeframe: "1h",
      dataPoints,
    });

    const recent = engine.getRecentPredictions(10);
    expect(recent).toHaveLength(2);
  });

  it("should identify active predictions", async () => {
    const dataPoints: DataPoint[] = [
      {
        source: "price",
        timestamp: new Date(),
        value: 100,
        confidence: 0.9,
      },
    ];

    await engine.generatePrediction({
      market: "SOL/USD",
      timeframe: "24h", // Will expire in 24 hours
      dataPoints,
    });

    const active = engine.getActivePredictions();
    expect(active).toHaveLength(1);
    expect(active[0].market).toBe("SOL/USD");
  });
});

describe("PredictionBehavior", () => {
  let behavior: PredictionBehavior;

  beforeEach(() => {
    behavior = new PredictionBehavior({
      enabled: true,
      markets: ["SOL/USD"],
      updateInterval: 60000,
      minConfidence: 0.6,
    });
  });

  it("should generate prediction on demand", async () => {
    const prediction = await behavior.generatePrediction(
      "SOL/USD",
      "24h",
    );

    expect(prediction.market).toBe("SOL/USD");
    expect(prediction.timeframe).toBe("24h");
  });

  it("should format prediction for sharing", async () => {
    const prediction = await behavior.generatePrediction(
      "SOL/USD",
      "24h",
    );

    const formatted = behavior.formatPrediction(prediction);

    expect(formatted).toContain("SOL/USD");
    expect(formatted).toContain("Prediction");
    expect(formatted).toContain("Probability");
    expect(formatted).toContain("Confidence");
  });

  it("should allow manual data point addition", () => {
    const dataPoint: DataPoint = {
      source: "custom_indicator",
      timestamp: new Date(),
      value: 0.75,
      confidence: 0.9,
    };

    expect(() => behavior.addDataPoint(dataPoint)).not.toThrow();
  });
});
