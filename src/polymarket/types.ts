/**
 * Polymarket integration for real-time prediction market data
 */

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  endDate: string;
  outcomes: string[];
  outcomePrices: number[]; // Probability 0-1 for each outcome
  volume: number;
  liquidity: number;
  active: boolean;
  category: string;
  tags: string[];
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  markets: PolymarketMarket[];
  startDate: string;
  endDate: string;
  image?: string;
}

export interface ClaudeAnalysis {
  prediction: string;
  confidence: number; // 0-1
  reasoning: string;
  keyFactors: string[];
  marketOpinion: "agree" | "disagree" | "neutral";
  recommendedAction: "bet_yes" | "bet_no" | "hold";
  riskLevel: "low" | "medium" | "high";
}

export interface PolymarketPrediction {
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
