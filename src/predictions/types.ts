/**
 * Prediction market types and interfaces
 */

export interface DataPoint {
  source: string;
  timestamp: Date;
  value: number | string | boolean;
  confidence: number; // 0-1
  metadata?: Record<string, any>;
}

export interface PredictionInput {
  market: string; // e.g., "SOL/USD", "BTC trend", "market sentiment"
  timeframe: string; // e.g., "1h", "24h", "7d"
  dataPoints: DataPoint[];
}

export interface Prediction {
  market: string;
  timeframe: string;
  outcome: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  reasoning: string;
  dataUsed: string[];
  timestamp: Date;
  expiresAt: Date;
}

export interface MarketAnalysis {
  market: string;
  sentiment: "bullish" | "bearish" | "neutral";
  momentum: number; // -1 to 1
  volatility: number; // 0-1
  signals: {
    technical: number; // -1 to 1
    social: number; // -1 to 1
    onchain: number; // -1 to 1
  };
  keyFactors: string[];
}

export interface PredictionHistory {
  predictions: Prediction[];
  accuracy: number; // overall accuracy 0-1
  totalPredictions: number;
  correctPredictions: number;
}

export type DataSource =
  | "price"
  | "volume"
  | "social"
  | "onchain"
  | "news"
  | "technical"
  | "sentiment";
