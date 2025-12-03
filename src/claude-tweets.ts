/**
 * AI-powered tweet generator using Claude
 * Generates contextual tweets about Warelay Agent
 */

import dotenv from "dotenv";
import { TwitterClient } from "./providers/twitter/client.js";
import type { TwitterCredentials } from "./providers/twitter/types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";

dotenv.config({ quiet: true });

const execAsync = promisify(exec);

interface TweetGenerationOptions {
  topic?: string;
  style?: "informative" | "technical" | "casual" | "community" | "philosophical";
  maxLength?: number;
  count?: number;
  includeLink?: boolean;
}

const stylePrompts = {
  informative: "Write an informative tweet explaining what Warelay Agent is and why it matters. Be clear and compelling.",
  technical: "Write a technical tweet about Warelay Agent's architecture or features. Include technical details that appeal to developers.",
  casual: "Write a casual, engaging tweet about Warelay Agent. Be friendly and approachable. Use emojis. Share insights or interesting facts.",
  community: "Write a community-focused tweet that encourages engagement or welcomes contributors to Warelay Agent. Ask questions or share excitement.",
  philosophical: "Write a thoughtful tweet about the future of autonomous agents or AI. Be insightful and thought-provoking.",
};

async function generateTweetWithClaude(
  prompt: string,
  includeLink: boolean = false,
): Promise<string> {
  const linkInstruction = includeLink 
    ? "Include github.com/warelayagent/warelay-agent at the end if it fits naturally."
    : "Do NOT include any links or URLs.";

  const fullPrompt = `${prompt}

CRITICAL RULES:
- Maximum 280 characters (strict limit)
- ${linkInstruction}
- Be concise and engaging
- No quotes around the tweet
- No hashtags unless specifically asked
- Return ONLY the tweet text, nothing else
- Sound human, not like marketing copy

Generate the tweet now:`;

  try {
    // Try using Claude CLI if available
    const { stdout } = await execAsync(`echo "${fullPrompt.replace(/"/g, '\\"')}" | claude --no-stream 2>/dev/null`);
    const tweet = stdout.trim();
    
    if (tweet && tweet.length > 0 && tweet.length <= 280) {
      return tweet;
    }
  } catch (error) {
    // Claude CLI not available or failed, use fallback
  }

  // Fallback: generate without AI
  return generateFallbackTweet(prompt, includeLink);
}

function generateFallbackTweet(prompt: string, includeLink: boolean = false): string {
  const link = includeLink ? "\n\ngithub.com/warelayagent/warelay-agent" : "";
  
  // Non-promotional fallback tweets
  const fallbacks = [
    `🤖 Warelay Agent handles the infrastructure: persistence, context tracking, multi-platform routing. You focus on the AI logic.${link}`,
    `Building autonomous AI agents? The hard part isn't the AI—it's persistence, state management, and reliable delivery. That's what Warelay Agent solves.${link}`,
    `Warelay Agent: Think of it as the nervous system connecting AI brains to communication platforms. Twitter, WhatsApp, and beyond.${link}`,
    `The provider pattern in Warelay Agent means adding Discord, Telegram, or Slack is ~200 lines of code. Built for extensibility.${link}`,
    `Key insight: Most AI agents fail because they don't persist. Warelay Agent solves this with session management and state tracking.${link}`,
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export async function generateAndPostTweets(
  credentials: TwitterCredentials,
  options: TweetGenerationOptions = {},
): Promise<void> {
  const {
    topic = "general",
    style = "informative",
    maxLength = 280,
    count = 1,
    includeLink = false,
  } = options;

  const client = new TwitterClient(credentials);

  console.log(`\n🤖 Generating ${count} tweet(s)...`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Style: ${style}`);
  console.log(`   Links: ${includeLink ? 'Always' : 'Only on first tweet'}\n`);

  for (let i = 0; i < count; i++) {
    try {
      const stylePrompt = stylePrompts[style] || stylePrompts.casual;
      const topicContext = topic !== "general" 
        ? `Focus specifically on: ${topic}.` 
        : "";
      
      // Only include link on the first tweet, unless explicitly requested
      const shouldIncludeLink = includeLink || i === 0;

      const prompt = `You are generating a tweet for Warelay Agent, an open-source autonomous AI agent framework.

${stylePrompt}
${topicContext}

Context about Warelay Agent:
- Infrastructure for autonomous AI agents that persist and remember
- Multi-platform: Twitter DMs/mentions, WhatsApp (Twilio/Baileys)
- AI-powered auto-reply (Claude, GPT, custom models)
- Session management with conversation memory
- Provider pattern makes it easy to add new platforms
- One-click deploy to Railway/Render
- Built with TypeScript, Node.js 22+
- Open source, MIT license

IMPORTANT: Write like a human developer sharing something interesting, not like a marketing department. Be authentic.`;

      console.log(`📝 Generating tweet ${i + 1}/${count} ${shouldIncludeLink ? '(with link)' : '(no link)'}...`);
      const tweetText = await generateTweetWithClaude(prompt, shouldIncludeLink);

      // Validate length
      if (tweetText.length > maxLength) {
        console.log(`⚠️  Tweet too long (${tweetText.length} chars), truncating...`);
        const truncated = tweetText.substring(0, maxLength - 3) + "...";
        console.log(`📤 Posting: ${truncated}`);
        const result = await client.sendTweet({ text: truncated });
        console.log(`✅ Posted: https://twitter.com/i/status/${result.id}\n`);
      } else {
        console.log(`📤 Posting: ${tweetText}`);
        const result = await client.sendTweet({ text: tweetText });
        console.log(`✅ Posted: https://twitter.com/i/status/${result.id}\n`);
      }

      // Wait between tweets if posting multiple
      if (i < count - 1) {
        const waitTime = 5 * 60 * 1000; // 5 minutes
        console.log(`⏱️  Waiting 5 minutes before next tweet...\n`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (error: any) {
      console.error(`❌ Failed to generate/post tweet ${i + 1}:`, error.message);
      if (error.data) {
        console.error(`   Details:`, error.data);
      }
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

  const style = (process.argv[2] as any) || "casual";
  const count = parseInt(process.argv[3]) || 1;
  const topic = process.argv[4] || "general";
  const includeLinks = process.argv.includes("--links");

  if (!["informative", "technical", "casual", "community", "philosophical"].includes(style)) {
    console.log("Usage: tsx src/claude-tweets.ts <style> [count] [topic] [--links]");
    console.log("\nStyles:");
    console.log("  informative   - Clear explanations of what Warelay Agent is");
    console.log("  technical     - Deep dives into architecture and features");
    console.log("  casual        - Friendly, engaging content with emojis");
    console.log("  community     - Engagement and contributor welcomes");
    console.log("  philosophical - Thoughtful takes on AI and automation");
    console.log("\nFlags:");
    console.log("  --links       Include GitHub link in ALL tweets (default: only first)");
    console.log("\nExamples:");
    console.log("  tsx src/claude-tweets.ts casual 3");
    console.log("  tsx src/claude-tweets.ts technical 2 'session management'");
    console.log("  tsx src/claude-tweets.ts philosophical 5 --links");
    process.exit(1);
  }

  await generateAndPostTweets(credentials, { 
    style, 
    count, 
    topic, 
    includeLink: includeLinks,
  });
}
