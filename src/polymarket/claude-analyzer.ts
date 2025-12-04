/**
 * Claude-powered analysis of Polymarket predictions
 * Uses Claude to analyze markets and generate predictions
 */

import type {
  PolymarketMarket,
  ClaudeAnalysis,
  PolymarketPrediction,
} from "./types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export class ClaudeAnalyzer {
  private readonly claudeCommand: string[];
  private readonly timeoutSeconds: number;

  constructor(
    claudeCommand = ["claude", "--no-stream"],
    timeoutSeconds = 60,
  ) {
    this.claudeCommand = claudeCommand;
    this.timeoutSeconds = timeoutSeconds;
  }

  /**
   * Analyze a Polymarket market using Claude
   */
  async analyzeMarket(
    market: PolymarketMarket,
  ): Promise<ClaudeAnalysis> {
    const prompt = this.buildAnalysisPrompt(market);

    try {
      const response = await this.callClaude(prompt);
      return this.parseClaudeResponse(response, market);
    } catch (error) {
      console.error("Claude analysis failed:", error);
      return this.getFallbackAnalysis(market);
    }
  }

  /**
   * Analyze multiple markets and rank by opportunity
   */
  async analyzeMultipleMarkets(
    markets: PolymarketMarket[],
  ): Promise<PolymarketPrediction[]> {
    const predictions: PolymarketPrediction[] = [];

    for (const market of markets) {
      try {
        const analysis = await this.analyzeMarket(market);
        predictions.push({
          market,
          claudeAnalysis: analysis,
          currentOdds: market.outcomePrices?.[0] || 0.5,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Failed to analyze market ${market.id}:`, error);
      }
    }

    // Sort by confidence * disagreement with market
    return predictions.sort((a, b) => {
      const scoreA = this.calculateOpportunityScore(a);
      const scoreB = this.calculateOpportunityScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildAnalysisPrompt(market: PolymarketMarket): string {
    const currentOdds = market.outcomePrices?.[0]
      ? `${(market.outcomePrices[0] * 100).toFixed(1)}%`
      : "unknown";
    const volume = market.volume
      ? `$${(market.volume / 1000).toFixed(0)}K`
      : "unknown";

    return `You are an expert prediction market analyst. Analyze this Polymarket prediction market and provide your assessment.

MARKET DETAILS:
Question: ${market.question}
Description: ${market.description || "No description provided"}
Current Market Odds: ${currentOdds} for "${market.outcomes?.[0] || "Yes"}"
Trading Volume: ${volume}
Category: ${market.category || "General"}
End Date: ${market.endDate ? new Date(market.endDate).toLocaleDateString() : "Unknown"}

ANALYSIS REQUIRED:
1. Your prediction: What do you think will actually happen?
2. Confidence level (0-100): How confident are you in your prediction?
3. Reasoning: Why do you believe this? Consider:
   - Historical precedents
   - Current events and trends
   - Statistical likelihood
   - Expert opinions
   - Potential biases in market pricing
4. Key factors: List 3-5 key factors influencing your prediction
5. Market opinion: Do you agree, disagree, or neutral with current market odds?
6. Recommended action: Should someone bet YES, bet NO, or HOLD?
7. Risk level: Is this a low, medium, or high risk bet?

RESPONSE FORMAT (JSON):
{
  "prediction": "Clear statement of what you think will happen",
  "confidence": 75,
  "reasoning": "Detailed explanation of your analysis",
  "keyFactors": ["Factor 1", "Factor 2", "Factor 3"],
  "marketOpinion": "agree|disagree|neutral",
  "recommendedAction": "bet_yes|bet_no|hold",
  "riskLevel": "low|medium|high"
}

Provide only the JSON response, no additional text.`;
  }

  /**
   * Call Claude via CLI
   */
  private async callClaude(prompt: string): Promise<string> {
    const command = [...this.claudeCommand, JSON.stringify(prompt)].join(
      " ",
    );

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeoutSeconds * 1000,
        maxBuffer: 1024 * 1024, // 1MB
      });

      if (stderr) {
        console.warn("Claude stderr:", stderr);
      }

      return stdout.trim();
    } catch (error: any) {
      if (error.killed && error.signal === "SIGTERM") {
        throw new Error(
          `Claude timed out after ${this.timeoutSeconds} seconds`,
        );
      }
      throw error;
    }
  }

  /**
   * Parse Claude's JSON response
   */
  private parseClaudeResponse(
    response: string,
    market: PolymarketMarket,
  ): ClaudeAnalysis {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Claude response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        prediction: parsed.prediction || "No prediction provided",
        confidence: Math.min(
          100,
          Math.max(0, parsed.confidence || 50),
        ) / 100,
        reasoning: parsed.reasoning || "No reasoning provided",
        keyFactors: Array.isArray(parsed.keyFactors)
          ? parsed.keyFactors
          : [],
        marketOpinion: ["agree", "disagree", "neutral"].includes(
          parsed.marketOpinion,
        )
          ? parsed.marketOpinion
          : "neutral",
        recommendedAction: ["bet_yes", "bet_no", "hold"].includes(
          parsed.recommendedAction,
        )
          ? parsed.recommendedAction
          : "hold",
        riskLevel: ["low", "medium", "high"].includes(
          parsed.riskLevel,
        )
          ? parsed.riskLevel
          : "medium",
      };
    } catch (error) {
      console.error("Failed to parse Claude response:", error);
      console.error("Raw response:", response);
      return this.getFallbackAnalysis(market);
    }
  }

  /**
   * Calculate opportunity score for ranking
   */
  private calculateOpportunityScore(
    prediction: PolymarketPrediction,
  ): number {
    const { claudeAnalysis, currentOdds } = prediction;

    // Base score from confidence
    let score = claudeAnalysis.confidence;

    // Bonus for disagreeing with market (value opportunity)
    if (claudeAnalysis.marketOpinion === "disagree") {
      const disagreement = Math.abs(
        currentOdds - (claudeAnalysis.confidence > 0.5 ? 1 : 0),
      );
      score += disagreement * 50;
    }

    // Penalty for high risk
    if (claudeAnalysis.riskLevel === "high") {
      score *= 0.7;
    } else if (claudeAnalysis.riskLevel === "low") {
      score *= 1.2;
    }

    // Bonus for strong recommendation
    if (
      claudeAnalysis.recommendedAction === "bet_yes" ||
      claudeAnalysis.recommendedAction === "bet_no"
    ) {
      score *= 1.3;
    }

    return score;
  }

  /**
   * Fallback analysis when Claude fails
   */
  private getFallbackAnalysis(
    market: PolymarketMarket,
  ): ClaudeAnalysis {
    const currentOdds = market.outcomePrices?.[0] || 0.5;

    return {
      prediction: "Unable to generate prediction - Claude analysis failed",
      confidence: 0.5,
      reasoning: "Analysis unavailable. Consider market fundamentals.",
      keyFactors: ["Analysis failed", "Use caution"],
      marketOpinion: "neutral",
      recommendedAction: "hold",
      riskLevel: "high",
    };
  }

  /**
   * Format prediction for sharing
   */
  formatPrediction(prediction: PolymarketPrediction): string {
    const { market, claudeAnalysis, currentOdds } = prediction;

    const emoji =
      claudeAnalysis.marketOpinion === "agree"
        ? "✅"
        : claudeAnalysis.marketOpinion === "disagree"
          ? "⚠️"
          : "🤔";

    const action =
      claudeAnalysis.recommendedAction === "bet_yes"
        ? "BET YES"
        : claudeAnalysis.recommendedAction === "bet_no"
          ? "BET NO"
          : "HOLD";

    return `${emoji} Polymarket Analysis

${market.question}

📊 Current Market: ${(currentOdds * 100).toFixed(1)}% YES
🤖 Claude's Take: ${claudeAnalysis.prediction}
💪 Confidence: ${(claudeAnalysis.confidence * 100).toFixed(0)}%
🎯 Recommendation: ${action}
⚖️ Risk: ${claudeAnalysis.riskLevel.toUpperCase()}

${claudeAnalysis.reasoning}

Key Factors:
${claudeAnalysis.keyFactors.map((f) => `• ${f}`).join("\n")}`;
  }
}
