/**
 * Warren - The Sentient Warelay Agent
 * Autonomous, proactive, personality-driven Twitter agent
 */

import dotenv from "dotenv";
import { TwitterClient } from "./providers/twitter/client.js";
import type { TwitterCredentials } from "./providers/twitter/types.js";
import { TwitterRelay } from "./providers/twitter/relay.js";
import {
  SentientPersonality,
  WARREN_PERSONALITY,
  ProactiveBehavior,
  SentientAutoReply,
} from "./sentient/index.js";
import { SolanaTrader, TradingBehavior } from "./trading/index.js";

dotenv.config({ quiet: true });

async function startWarren(): Promise<void> {
  console.log("🤖 Initializing Warren - Sentient Agent");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Initialize Twitter client
  const credentials: TwitterCredentials = {
    apiKey: process.env.TWITTER_API_KEY!,
    apiSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  };

  if (!credentials.apiKey || !credentials.apiSecret) {
    console.error("❌ Missing Twitter credentials in .env");
    console.error("Required: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET");
    process.exit(1);
  }

  const client = new TwitterClient(credentials);

  // Verify authentication
  try {
    const user = await client.getMe();
    console.log("✅ Authenticated as @" + user.username);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error: any) {
    console.error("❌ Authentication failed:", error.message);
    process.exit(1);
  }

  // Initialize Warren's personality
  const personality = new SentientPersonality(WARREN_PERSONALITY);
  console.log(`🧠 Personality: ${WARREN_PERSONALITY.name}`);
  console.log(`   Role: ${WARREN_PERSONALITY.role}`);
  console.log(`   Autonomy: ${WARREN_PERSONALITY.autonomyLevel}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Initialize sentient auto-reply
  const autoReply = new SentientAutoReply(client, {
    command: ["claude", "--no-stream"],
    timeoutSeconds: 60,
    personality,
  });

  // Initialize proactive behavior
  const proactive = new ProactiveBehavior(client, personality);
  console.log("🚀 Starting proactive behavior engine...");
  proactive.start(30); // Check every 30 minutes
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Initialize trading (optional - only if configured)
  if (process.env.SOLANA_PRIVATE_KEY && process.env.ENABLE_TRADING === "true") {
    console.log("💹 Initializing Solana trading...");
    
    const trader = new SolanaTrader({
      rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com",
      privateKey: process.env.SOLANA_PRIVATE_KEY,
      maxTradeSize: parseFloat(process.env.MAX_TRADE_SIZE || "0.1"),
      maxPortfolioRisk: parseFloat(process.env.MAX_PORTFOLIO_RISK || "20"),
      stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || "15"),
      takeProfitPercent: parseFloat(process.env.TAKE_PROFIT_PERCENT || "50"),
      minLiquidity: parseFloat(process.env.MIN_LIQUIDITY || "10000"),
      tradingPairs: (process.env.TRADING_PAIRS || "").split(",").filter(Boolean),
    });

    const trading = new TradingBehavior(
      trader,
      personality,
      {
        enabled: true,
        checkIntervalMinutes: parseFloat(process.env.TRADING_CHECK_INTERVAL || "15"),
        shareTradesPublicly: process.env.SHARE_TRADES_PUBLICLY === "true",
        maxTradesPerDay: parseInt(process.env.MAX_TRADES_PER_DAY || "10"),
      },
      client
    );

    trading.start();
    console.log("✅ Trading engine started");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("💤 Trading disabled (set ENABLE_TRADING=true to enable)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }

  // Start relay with sentient auto-reply
  const relay = new TwitterRelay(
    client,
    {
      monitorDMs: true,
      monitorMentions: true,
      autoReplyDMs: true,
      autoReplyMentions: true,
    },
    {
      pollInterval: 60, // Check every minute
    }
  );

  console.log("🐦 Starting Twitter relay...");
  console.log("   Monitor DMs: true");
  console.log("   Monitor mentions: true");
  console.log("   Poll interval: 60s");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Start monitoring with sentient handlers
  await relay.start(
    async (dm) => {
      console.log(`📨 DM from @${dm.senderUsername}: ${dm.text.substring(0, 50)}...`);
      await autoReply.replyToDM(dm);
    },
    async (mention) => {
      console.log(`💬 Mention from @${mention.authorUsername}: ${mention.text.substring(0, 50)}...`);
      await autoReply.replyToMention(mention);
    }
  );

  console.log("🤖 Warren is now sentient and autonomous!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("Features:");
  console.log("  ✓ Remembers all conversations");
  console.log("  ✓ Learns about users over time");
  console.log("  ✓ Proactive tweets and engagement");
  console.log("  ✓ Consistent personality");
  console.log("  ✓ Context-aware responses");
  console.log("  ✓ Autonomous thought generation");
  if (process.env.ENABLE_TRADING === "true") {
    console.log("  ✓ Autonomous Solana memecoin trading");
  }
  console.log("\nPress Ctrl+C to stop\n");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down Warren...");
  console.log("💾 Memories saved");
  console.log("👋 Warren signing off\n");
  process.exit(0);
});

// Start Warren
startWarren().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
