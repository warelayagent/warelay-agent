/**
 * Twitter relay command - monitor and auto-reply
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { TwitterClient } from "../providers/twitter/client.js";
import { TwitterAutoReply } from "../providers/twitter/auto-reply.js";
import { TwitterRelay } from "../providers/twitter/relay.js";
import type { TwitterConfig } from "../providers/twitter/types.js";

export interface TwitterRelayCommandOptions {
  config?: string; // Path to config file
  interval?: number; // Poll interval in seconds
  monitorDMs?: boolean;
  monitorMentions?: boolean;
  verbose?: boolean;
}

export async function twitterRelayCommand(
  options: TwitterRelayCommandOptions,
  client: TwitterClient,
): Promise<void> {
  // Load config
  const configPath =
    options.config || path.join(os.homedir(), ".warelay", "twitter.json");
  
  let config: TwitterConfig & { autoReply?: any } = {
    monitorDMs: options.monitorDMs ?? true,
    monitorMentions: options.monitorMentions ?? true,
  };

  try {
    const configContent = await fs.readFile(configPath, "utf-8");
    const loadedConfig = JSON.parse(configContent);
    config = { ...config, ...loadedConfig };
    console.log(`📋 Loaded config from: ${configPath}`);
  } catch (error) {
    if (options.verbose) {
      console.log(`ℹ️  No config file found at ${configPath}, using defaults`);
    }
  }

  // Load state (last processed IDs)
  const statePath = path.join(os.homedir(), ".warelay", "twitter-state.json");
  let lastDMId: string | undefined;
  let lastMentionId: string | undefined;

  try {
    const stateContent = await fs.readFile(statePath, "utf-8");
    const state = JSON.parse(stateContent);
    lastDMId = state.lastDMId;
    lastMentionId = state.lastMentionId;
    if (options.verbose) {
      console.log(`📊 Loaded state from: ${statePath}`);
      if (lastDMId) console.log(`  Last DM: ${lastDMId}`);
      if (lastMentionId) console.log(`  Last mention: ${lastMentionId}`);
    }
  } catch (error) {
    // No state file, starting fresh
  }

  // Setup auto-reply if configured
  let autoReply: TwitterAutoReply | undefined;
  if (config.autoReply) {
    autoReply = new TwitterAutoReply(client, config.autoReply);
    console.log(`🤖 Auto-reply enabled (mode: ${config.autoReply.mode})`);
  }

  // Create relay
  const relay = new TwitterRelay(client, config, {
    pollInterval: options.interval || 60,
    lastProcessedDM: lastDMId,
    lastProcessedMention: lastMentionId,
    verbose: options.verbose,
  });

  // Setup handlers
  const onDM = async (dm: any) => {
    if (config.autoReplyDMs && autoReply) {
      await autoReply.replyToDM(dm);
    }
  };

  const onMention = async (mention: any) => {
    if (config.autoReplyMentions && autoReply) {
      await autoReply.replyToMention(mention);
    }
  };

  // Save state periodically
  const saveState = async () => {
    const state = relay.getState();
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    if (options.verbose) {
      console.log(`💾 State saved`);
    }
  };

  // Save state every 5 minutes
  const stateInterval = setInterval(saveState, 5 * 60 * 1000);

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Shutting down...");
    clearInterval(stateInterval);
    relay.stop();
    await saveState();
    console.log("👋 Goodbye!");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Start relay
  try {
    await relay.start(onDM, onMention);
  } catch (error: any) {
    console.error("❌ Relay error:", error.message);
    await saveState();
    throw error;
  }
}
