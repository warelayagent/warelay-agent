/**
 * Trading API Server
 * Serves Warelay's trading data to the web terminal
 */

import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const app = express();
const PORT = process.env.TRADING_API_PORT || 3001;

// Enable CORS for website
app.use(cors());
app.use(express.json());

// Path to Warelay's trading state
const TRADING_STATE_PATH = path.join(os.homedir(), ".warelay", "warelay-trading.json");
const MEMORY_PATH = path.join(os.homedir(), ".warelay", "warelay-memory.json");

/**
 * Load trading state
 */
async function loadTradingState() {
  try {
    const data = await fs.readFile(TRADING_STATE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {
      positions: {},
      tradeHistory: [],
      portfolio: {
        solBalance: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
        activePositions: 0,
      },
    };
  }
}

/**
 * Load Warelay's thoughts from memory
 */
async function loadThoughts() {
  try {
    const data = await fs.readFile(MEMORY_PATH, "utf-8");
    const memory = JSON.parse(data);
    
    // Extract thoughts from user interactions
    const thoughts: Array<{ text: string; timestamp: Date }> = [];
    
    for (const user of Object.values(memory) as any[]) {
      if (user.context && Array.isArray(user.context)) {
        // Find Warelay's responses (prefixed with [Warelay replied:])
        const warelayThoughts = user.context
          .filter((msg: string) => msg.startsWith("[Warelay replied:"))
          .map((msg: string) => ({
            text: msg.replace("[Warelay replied: ", "").replace("]", ""),
            timestamp: user.lastSeen,
          }));
        thoughts.push(...warelayThoughts);
      }
    }
    
    // Sort by timestamp, most recent first
    return thoughts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 20); // Return last 20 thoughts
  } catch (error) {
    return [];
  }
}

/**
 * Calculate performance over time
 */
function calculatePerformance(trades: any[]): number[] {
  const hours = 24;
  const performance = new Array(hours).fill(0);
  
  // Aggregate P&L by hour
  trades.forEach(trade => {
    if (trade.pnl) {
      const hour = new Date(trade.timestamp).getHours();
      performance[hour] += trade.pnl;
    }
  });
  
  // Cumulative P&L
  for (let i = 1; i < hours; i++) {
    performance[i] += performance[i - 1];
  }
  
  return performance;
}

/**
 * Main API endpoint
 */
app.get("/api/warelay-trading", async (req, res) => {
  try {
    const state = await loadTradingState();
    const thoughts = await loadThoughts();
    
    // Convert positions object to array
    const positions = Object.values(state.positions || {});
    
    // Calculate portfolio stats
    const totalPnl = positions.reduce((sum: number, p: any) => sum + (p.pnl || 0), 0);
    const activePositions = positions.length;
    
    // Get recent trades
    const trades = (state.tradeHistory || [])
      .sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 50); // Last 50 trades
    
    // Calculate 24h performance
    const performance = calculatePerformance(trades);
    
    const response = {
      portfolio: {
        solBalance: state.portfolio?.solBalance || 0,
        totalPnl,
        totalPnlPercent: state.portfolio?.totalPnlPercent || 0,
        activePositions,
      },
      positions: positions.map((p: any) => ({
        symbol: p.symbol,
        mint: p.mint,
        balance: p.balance,
        entryPrice: p.entryPrice,
        currentPrice: p.currentPrice,
        pnl: p.pnl,
        pnlPercent: p.pnlPercent,
      })),
      trades: trades.map((t: any) => ({
        action: t.action,
        symbol: t.symbol || "UNKNOWN",
        amount: t.amount,
        price: t.price,
        pnl: t.pnl,
        timestamp: t.timestamp,
      })),
      thoughts: thoughts.map(t => ({
        text: t.text,
        timestamp: t.timestamp,
      })),
      performance,
      status: "active",
      lastUpdate: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error loading trading data:", error);
    res.status(500).json({
      error: "Failed to load trading data",
      status: "error",
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Serve static website files
 */
app.use(express.static("website"));

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n💹 Trading API server running on http://localhost:${PORT}`);
  console.log(`   Terminal: http://localhost:${PORT}/terminal.html`);
  console.log(`   API: http://localhost:${PORT}/api/warelay-trading\n`);
});

export default app;
