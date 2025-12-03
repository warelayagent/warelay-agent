#!/usr/bin/env node
/**
 * Warelay Agent CLI - Multi-platform messaging automation
 * Twitter provider - based on warelay framework
 */

import { Command } from "commander";
import dotenv from "dotenv";
import { createTwitterClient } from "./providers/twitter/client.js";
import type { TwitterCredentials } from "./providers/twitter/types.js";
import { tweetCommand } from "./commands/twitter-tweet.js";
import { twitterDMCommand } from "./commands/twitter-dm.js";
import { twitterRelayCommand } from "./commands/twitter-relay.js";

dotenv.config({ quiet: true });

const program = new Command();

program
  .name("warelay-agent")
  .description("Warelay Agent - Automated Twitter messaging (post, DM, monitor, auto-reply)")
  .version("1.0.0");

/**
 * Get Twitter credentials from environment
 */
function getCredentials(): TwitterCredentials {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.error("❌ Missing Twitter credentials in environment!");
    console.error("Required variables:");
    console.error("  - TWITTER_API_KEY");
    console.error("  - TWITTER_API_SECRET");
    console.error("  - TWITTER_ACCESS_TOKEN");
    console.error("  - TWITTER_ACCESS_SECRET");
    console.error("\nAdd these to your .env file or export them in your shell.");
    process.exit(1);
  }

  return {
    apiKey,
    apiSecret,
    accessToken,
    accessSecret,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
  };
}

/**
 * Tweet command
 */
program
  .command("tweet")
  .description("Post a tweet")
  .requiredOption("-t, --text <text>", "Tweet text")
  .option("-r, --reply-to <id>", "Reply to tweet ID")
  .option("-q, --quote <id>", "Quote tweet ID")
  .option("-m, --media <path>", "Media file path")
  .option("-v, --verbose", "Verbose output")
  .option("--dry-run", "Simulate without posting")
  .action(async (options) => {
    const credentials = getCredentials();
    const client = createTwitterClient(credentials);
    await tweetCommand(options, client);
  });

/**
 * DM command
 */
program
  .command("dm")
  .description("Send a direct message")
  .requiredOption("--to <username>", "Recipient username or user ID")
  .requiredOption("-m, --message <text>", "Message text")
  .option("--media <path>", "Media file path")
  .option("-v, --verbose", "Verbose output")
  .option("--dry-run", "Simulate without sending")
  .action(async (options) => {
    const credentials = getCredentials();
    const client = createTwitterClient(credentials);
    await twitterDMCommand(options, client);
  });

/**
 * Relay command
 */
program
  .command("relay")
  .description("Monitor DMs and mentions, auto-reply if configured")
  .option("-c, --config <path>", "Config file path (~/.warelay/twitter.json)")
  .option("-i, --interval <seconds>", "Poll interval", "60")
  .option("--monitor-dms", "Monitor direct messages", true)
  .option("--monitor-mentions", "Monitor mentions", true)
  .option("-v, --verbose", "Verbose output")
  .action(async (options) => {
    const credentials = getCredentials();
    const client = createTwitterClient(credentials);
    await twitterRelayCommand(
      {
        ...options,
        interval: Number.parseInt(options.interval, 10),
      },
      client,
    );
  });

/**
 * Status command
 */
program
  .command("status")
  .description("Show account info and recent activity")
  .option("-v, --verbose", "Verbose output")
  .action(async (options) => {
    const credentials = getCredentials();
    const client = createTwitterClient(credentials);
    
    try {
      const me = await client.getMe();
      console.log("👤 Authenticated as:");
      console.log(`  Name: ${me.name}`);
      console.log(`  Username: @${me.username}`);
      console.log(`  User ID: ${me.id}`);
      
      if (options.verbose) {
        console.log("\n📨 Recent DMs:");
        const dms = await client.getRecentDMs(undefined, 5);
        if (dms.length === 0) {
          console.log("  (none)");
        } else {
          for (const dm of dms) {
            console.log(`  ${dm.createdAt.toISOString()} - ${dm.senderId}: ${dm.text.substring(0, 50)}...`);
          }
        }
        
        console.log("\n🔔 Recent mentions:");
        const mentions = await client.getMentions(undefined, 5);
        if (mentions.length === 0) {
          console.log("  (none)");
        } else {
          for (const mention of mentions) {
            console.log(`  ${mention.createdAt.toISOString()} - @${mention.authorUsername}: ${mention.text.substring(0, 50)}...`);
          }
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to get status:", error.message);
      throw error;
    }
  });

/**
 * Search command
 */
program
  .command("search")
  .description("Search tweets by keyword")
  .requiredOption("-q, --query <query>", "Search query")
  .option("-l, --limit <number>", "Max results", "20")
  .option("-v, --verbose", "Verbose output")
  .action(async (options) => {
    const credentials = getCredentials();
    const client = createTwitterClient(credentials);
    
    try {
      console.log(`🔍 Searching for: ${options.query}`);
      const tweets = await client.searchTweets(
        options.query,
        undefined,
        Number.parseInt(options.limit, 10),
      );
      
      console.log(`\nFound ${tweets.length} tweet(s):\n`);
      for (const tweet of tweets) {
        console.log(`─────────────────────────────────────────`);
        console.log(`Tweet ID: ${tweet.id}`);
        console.log(`Author: ${tweet.author_id}`);
        console.log(`Created: ${tweet.created_at}`);
        console.log(`Text: ${tweet.text}`);
        console.log(`URL: https://twitter.com/i/status/${tweet.id}`);
      }
    } catch (error: any) {
      console.error("❌ Search failed:", error.message);
      throw error;
    }
  });

program.parse();
