/**
 * Automated tweet scheduler with customizable content
 */

import { TwitterClient } from "./providers/twitter/client.js";
import type { TwitterCredentials } from "./providers/twitter/types.js";

interface TweetSchedule {
  content: string;
  delay?: number; // minutes
  media?: string;
}

export const tweetTemplates = {
  launch: [
    "🤖 Introducing Warelay Agent - autonomous AI infrastructure for Twitter & WhatsApp.\n\nMonitor DMs, auto-reply with Claude/GPT, deploy in minutes.\n\nOpen source • TypeScript • AI-powered\n\ngithub.com/warelayagent/warelay-agent",
    
    "Building autonomous AI agents that remember, persist, and operate 24/7 🤖\n\nWarelay Agent = Infrastructure for digital minds\n\nOpen source, built with TypeScript, AI-powered\n\ngithub.com/warelayagent/warelay-agent",
    
    "Warelay Agent isn't just another chatbot.\n\nIt's infrastructure for autonomous AI agents that persist, remember conversations, and operate 24/7 across platforms.\n\nDeploy yours: github.com/warelayagent/warelay-agent",
  ],
  
  features: [
    "🔥 Warelay Agent features:\n\n✅ Twitter DM & mention monitoring\n✅ WhatsApp integration (Twilio/Baileys)\n✅ AI auto-reply (Claude, GPT, custom)\n✅ Session management per user\n✅ One-click deploy to Railway/Render\n\nDocs: github.com/warelayagent/warelay-agent",
    
    "Why Warelay Agent?\n\n• Multi-platform (Twitter, WhatsApp, more coming)\n• Persistent context across sessions\n• Modular provider architecture\n• Deploy in 5 minutes\n• Full TypeScript\n\nPerfect for AI researchers and production deployments.",
    
    "Real autonomy = persistence + memory + multi-platform\n\nWarelay Agent provides:\n📡 Relay monitoring\n🧠 Context preservation\n🎯 Response orchestration\n🔌 Provider abstraction\n\nBuild agents that actually work.",
  ],
  
  technical: [
    "Warelay Agent architecture:\n\n• Provider pattern for platform abstraction\n• Session management with configurable scopes\n• Auto-reply engine (static/command modes)\n• Hot-loadable capabilities\n• Background monitoring with state tracking\n\nBuilt for scale.",
    
    "How it works:\n\n1. Monitor platforms (Twitter/WhatsApp)\n2. Maintain conversation context\n3. Generate AI responses (Claude/GPT)\n4. Auto-reply with chunking\n5. Persist sessions across restarts\n\nAll configurable, all open source.",
    
    "Deploy Warelay Agent in 3 commands:\n\nnpm install\ncp .env.example .env\nnpm run warelay-agent relay --auto-reply\n\nOr one-click deploy to Railway 🚂\n\nFull guide: github.com/warelayagent/warelay-agent",
  ],
  
  community: [
    "Who's Warelay Agent for?\n\n👨‍🔬 Researchers studying AI behavior\n🏗️ Builders deploying production agents\n🤖 Anyone wanting autonomous AI assistants\n\nOpen source, MIT licensed, built for everyone.\n\ngithub.com/warelayagent/warelay-agent",
    
    "Warelay Agent is live!\n\n⭐ Star the repo\n🍴 Fork and customize\n🚀 Deploy your agent\n💬 Join discussions\n\nLet's build autonomous AI infrastructure together.\n\ngithub.com/warelayagent/warelay-agent",
    
    "Built something with Warelay Agent?\n\nDrop a reply! Want to see:\n• Your use cases\n• Custom providers\n• AI personality configs\n• Deployment stories\n\nLet's showcase the community 🤝",
  ],
};

export async function sendScheduledTweets(
  credentials: TwitterCredentials,
  tweets: TweetSchedule[],
  dryRun = false,
): Promise<void> {
  let client: TwitterClient | undefined;
  
  if (!dryRun) {
    client = new TwitterClient(credentials);
  }

  for (let i = 0; i < tweets.length; i++) {
    const tweet = tweets[i];
    
    if (dryRun) {
      console.log(`\n[DRY RUN] Tweet ${i + 1}/${tweets.length}:`);
      console.log(tweet.content);
      console.log(`Delay: ${tweet.delay || 0} minutes\n`);
      continue;
    }
    
    if (!client) {
      throw new Error("Client not initialized");
    }

    try {
      console.log(`\n📝 Posting tweet ${i + 1}/${tweets.length}...`);
      
      let mediaIds: string[] | undefined;
      if (tweet.media) {
        console.log(`📤 Uploading media: ${tweet.media}`);
        const mediaId = await client.uploadMedia(tweet.media);
        mediaIds = [mediaId];
      }

      const result = await client.sendTweet({
        text: tweet.content,
        mediaIds,
      });

      console.log(`✅ Posted: https://twitter.com/i/status/${result.id}`);

      // Wait before next tweet
      if (i < tweets.length - 1 && tweet.delay) {
        const waitMs = tweet.delay * 60 * 1000;
        console.log(`⏱️  Waiting ${tweet.delay} minutes before next tweet...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    } catch (error) {
      console.error(`❌ Failed to post tweet ${i + 1}:`, error);
      break;
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const credentials: TwitterCredentials = {
    apiKey: process.env.TWITTER_API_KEY!,
    apiSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  };

  const category = process.argv[2] as keyof typeof tweetTemplates;
  const dryRun = process.argv.includes("--dry-run");

  if (!category || !(category in tweetTemplates)) {
    console.log("Usage: tsx src/tweet-scheduler.ts <category> [--dry-run]");
    console.log("\nCategories:");
    console.log("  launch     - Product launch tweets");
    console.log("  features   - Feature highlights");
    console.log("  technical  - Technical deep dives");
    console.log("  community  - Community engagement");
    process.exit(1);
  }

  const tweets = tweetTemplates[category].map((content, i) => ({
    content,
    delay: i === 0 ? 0 : 120, // 2 hours between tweets
  }));

  await sendScheduledTweets(credentials, tweets, dryRun);
}
