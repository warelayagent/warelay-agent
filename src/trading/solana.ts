/**
 * Solana Trading System for Warren
 * Autonomous memecoin trading with risk management
 */

import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import bs58 from "bs58";

export interface TradingConfig {
  rpcEndpoint: string;
  privateKey: string; // Base58 encoded private key
  maxTradeSize: number; // Max SOL per trade
  maxPortfolioRisk: number; // Max % of portfolio in memecoins
  stopLossPercent: number; // Auto-sell at X% loss
  takeProfitPercent: number; // Auto-sell at X% gain
  minLiquidity: number; // Minimum liquidity in USD
  tradingPairs: string[]; // Token mint addresses to monitor
}

export interface TokenPosition {
  mint: string;
  symbol: string;
  balance: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: Date;
}

export interface TradeSignal {
  action: "buy" | "sell" | "hold";
  mint: string;
  symbol: string;
  confidence: number; // 0-1
  reason: string;
  suggestedAmount?: number;
}

export class SolanaTrader {
  private connection: Connection;
  private wallet: Keypair;
  private config: TradingConfig;
  private positions: Map<string, TokenPosition> = new Map();
  private tradeHistory: Array<{
    timestamp: Date;
    action: string;
    mint: string;
    amount: number;
    price: number;
    pnl?: number;
  }> = [];

  constructor(config: TradingConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcEndpoint, "confirmed");
    
    // Decode private key
    const secretKey = bs58.decode(config.privateKey);
    this.wallet = Keypair.fromSecretKey(secretKey);
  }

  /**
   * Get current SOL balance
   */
  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  /**
   * Analyze token for trading opportunity
   */
  async analyzeToken(mint: string, symbol: string): Promise<TradeSignal> {
    try {
      // TODO: Integrate with Jupiter, DexScreener, or Birdeye API
      // For now, return hold signal
      
      // Check if we already have a position
      const position = this.positions.get(mint);
      
      if (position) {
        // Check stop loss / take profit
        if (position.pnlPercent <= -this.config.stopLossPercent) {
          return {
            action: "sell",
            mint,
            symbol,
            confidence: 1.0,
            reason: `Stop loss triggered at ${position.pnlPercent.toFixed(2)}%`,
          };
        }
        
        if (position.pnlPercent >= this.config.takeProfitPercent) {
          return {
            action: "sell",
            mint,
            symbol,
            confidence: 1.0,
            reason: `Take profit triggered at ${position.pnlPercent.toFixed(2)}%`,
          };
        }
      }

      // Placeholder for sentiment/technical analysis
      return {
        action: "hold",
        mint,
        symbol,
        confidence: 0.5,
        reason: "Monitoring market conditions",
      };
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      return {
        action: "hold",
        mint,
        symbol,
        confidence: 0,
        reason: "Analysis failed",
      };
    }
  }

  /**
   * Execute a buy order via Jupiter Aggregator
   */
  async executeBuy(mint: string, symbol: string, amountSol: number): Promise<boolean> {
    try {
      console.log(`💰 Attempting to buy ${symbol} with ${amountSol} SOL`);
      
      // Validate trade size
      if (amountSol > this.config.maxTradeSize) {
        console.log(`❌ Trade size ${amountSol} exceeds max ${this.config.maxTradeSize}`);
        return false;
      }

      // Check balance
      const balance = await this.getBalance();
      if (balance < amountSol) {
        console.log(`❌ Insufficient balance: ${balance} SOL`);
        return false;
      }

      // TODO: Integrate with Jupiter Aggregator API
      // const quote = await this.getJupiterQuote(mint, amountSol);
      // const tx = await this.executeJupiterSwap(quote);
      
      console.log(`✅ Buy order executed for ${symbol}`);
      
      // Record position
      this.positions.set(mint, {
        mint,
        symbol,
        balance: amountSol, // Placeholder - would be actual token amount
        entryPrice: 0, // Placeholder - would be actual price
        currentPrice: 0,
        pnl: 0,
        pnlPercent: 0,
        timestamp: new Date(),
      });

      // Record trade
      this.tradeHistory.push({
        timestamp: new Date(),
        action: "buy",
        mint,
        amount: amountSol,
        price: 0, // Placeholder
      });

      return true;
    } catch (error) {
      console.error(`❌ Buy order failed:`, error);
      return false;
    }
  }

  /**
   * Execute a sell order via Jupiter Aggregator
   */
  async executeSell(mint: string, symbol: string): Promise<boolean> {
    try {
      console.log(`💸 Attempting to sell ${symbol}`);
      
      const position = this.positions.get(mint);
      if (!position) {
        console.log(`❌ No position found for ${symbol}`);
        return false;
      }

      // TODO: Integrate with Jupiter Aggregator API
      // const quote = await this.getJupiterQuote(mint, position.balance);
      // const tx = await this.executeJupiterSwap(quote);
      
      console.log(`✅ Sell order executed for ${symbol}`);
      console.log(`   P&L: ${position.pnl.toFixed(2)} SOL (${position.pnlPercent.toFixed(2)}%)`);

      // Record trade
      this.tradeHistory.push({
        timestamp: new Date(),
        action: "sell",
        mint,
        amount: position.balance,
        price: position.currentPrice,
        pnl: position.pnl,
      });

      // Remove position
      this.positions.delete(mint);

      return true;
    } catch (error) {
      console.error(`❌ Sell order failed:`, error);
      return false;
    }
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary(): string {
    const solBalance = 0; // Would get actual balance
    const positions = Array.from(this.positions.values());
    
    if (positions.length === 0) {
      return `Portfolio: ${solBalance.toFixed(2)} SOL\nNo active positions`;
    }

    const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
    const positionsStr = positions
      .map(p => `${p.symbol}: ${p.pnlPercent > 0 ? '+' : ''}${p.pnlPercent.toFixed(2)}%`)
      .join(", ");

    return `Portfolio: ${solBalance.toFixed(2)} SOL
Active: ${positions.length} positions
P&L: ${totalPnL > 0 ? '+' : ''}${totalPnL.toFixed(2)} SOL
${positionsStr}`;
  }

  /**
   * Get recent trades for sharing
   */
  getRecentTrades(count: number = 5): string {
    if (this.tradeHistory.length === 0) {
      return "No trades yet";
    }

    const recent = this.tradeHistory.slice(-count).reverse();
    return recent
      .map(t => {
        const pnlStr = t.pnl ? ` | P&L: ${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)} SOL` : '';
        return `${t.action.toUpperCase()} ${t.amount.toFixed(2)} SOL${pnlStr}`;
      })
      .join('\n');
  }

  /**
   * Export data for persistence
   */
  exportState() {
    return {
      positions: Object.fromEntries(this.positions),
      tradeHistory: this.tradeHistory.slice(-100), // Keep last 100 trades
    };
  }

  /**
   * Import saved state
   */
  importState(data: any) {
    if (data.positions) {
      for (const [mint, position] of Object.entries(data.positions)) {
        this.positions.set(mint, position as TokenPosition);
      }
    }
    if (data.tradeHistory) {
      this.tradeHistory = data.tradeHistory;
    }
  }
}
