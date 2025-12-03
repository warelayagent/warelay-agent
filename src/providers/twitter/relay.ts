/**
 * Twitter relay - monitors DMs and mentions, triggers auto-replies
 */

import type { TwitterClient } from "./client.js";
import type { TwitterConfig, TwitterDM, TwitterMention, TwitterMonitorOptions } from "./types.js";

export class TwitterRelay {
  private client: TwitterClient;
  private config: TwitterConfig;
  private lastDMId?: string;
  private lastMentionId?: string;
  private isRunning = false;
  private pollInterval: number;

  constructor(
    client: TwitterClient,
    config: TwitterConfig = {},
    options: TwitterMonitorOptions = {},
  ) {
    this.client = client;
    this.config = {
      monitorDMs: true,
      monitorMentions: true,
      autoReplyDMs: false,
      autoReplyMentions: false,
      maxTweetsPerHour: 50,
      maxDMsPerHour: 100,
      ...config,
    };
    this.pollInterval = (options.pollInterval || 60) * 1000; // Convert to ms
    this.lastDMId = options.lastProcessedDM;
    this.lastMentionId = options.lastProcessedMention;
  }

  /**
   * Start monitoring loop
   */
  async start(
    onDM?: (dm: TwitterDM) => Promise<void>,
    onMention?: (mention: TwitterMention) => Promise<void>,
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error("Relay is already running");
    }

    this.isRunning = true;
    console.log("🐦 Twitter relay started");
    console.log(`  Monitor DMs: ${this.config.monitorDMs}`);
    console.log(`  Monitor mentions: ${this.config.monitorMentions}`);
    console.log(`  Poll interval: ${this.pollInterval / 1000}s`);

    while (this.isRunning) {
      try {
        // Check DMs
        if (this.config.monitorDMs) {
          await this.checkDMs(onDM);
        }

        // Check mentions
        if (this.config.monitorMentions) {
          await this.checkMentions(onMention);
        }

        // Wait before next poll
        await this.sleep(this.pollInterval);
      } catch (error) {
        console.error("Error in relay loop:", error);
        // Continue running despite errors
        await this.sleep(5000); // Brief pause on error
      }
    }
  }

  /**
   * Stop the relay
   */
  stop(): void {
    this.isRunning = false;
    console.log("🛑 Twitter relay stopped");
  }

  /**
   * Check for new DMs
   */
  private async checkDMs(onDM?: (dm: TwitterDM) => Promise<void>): Promise<void> {
    try {
      const dms = await this.client.getRecentDMs(this.lastDMId);
      
      if (dms.length === 0) {
        return;
      }

      console.log(`📨 Found ${dms.length} new DM(s)`);

      // Process DMs in chronological order
      dms.reverse();

      for (const dm of dms) {
        // Filter by allowed users
        if (this.config.allowedUsers && this.config.allowedUsers.length > 0) {
          // Would need to resolve userId to username - skip for now
        }

        // Filter by blocked users
        if (this.config.blockedUsers?.includes(dm.senderId)) {
          console.log(`  Skipped DM from blocked user: ${dm.senderId}`);
          continue;
        }

        console.log(`  DM from ${dm.senderId}: ${dm.text.substring(0, 50)}...`);

        // Call handler
        if (onDM) {
          await onDM(dm);
        }

        // Update last processed ID
        this.lastDMId = dm.id;
      }
    } catch (error) {
      console.error("Error checking DMs:", error);
    }
  }

  /**
   * Check for new mentions
   */
  private async checkMentions(
    onMention?: (mention: TwitterMention) => Promise<void>,
  ): Promise<void> {
    try {
      const mentions = await this.client.getMentions(this.lastMentionId);

      if (mentions.length === 0) {
        return;
      }

      console.log(`🔔 Found ${mentions.length} new mention(s)`);

      // Process mentions in chronological order
      mentions.reverse();

      for (const mention of mentions) {
        // Filter by allowed users
        if (
          this.config.allowedUsers &&
          this.config.allowedUsers.length > 0 &&
          !this.config.allowedUsers.includes(mention.authorUsername)
        ) {
          console.log(`  Skipped mention from non-allowed user: @${mention.authorUsername}`);
          continue;
        }

        // Filter by blocked users
        if (this.config.blockedUsers?.includes(mention.authorUsername)) {
          console.log(`  Skipped mention from blocked user: @${mention.authorUsername}`);
          continue;
        }

        console.log(`  Mention from @${mention.authorUsername}: ${mention.text.substring(0, 50)}...`);

        // Call handler
        if (onMention) {
          await onMention(mention);
        }

        // Update last processed ID
        this.lastMentionId = mention.id;
      }
    } catch (error) {
      console.error("Error checking mentions:", error);
    }
  }

  /**
   * Get current state (for persistence)
   */
  getState() {
    return {
      lastDMId: this.lastDMId,
      lastMentionId: this.lastMentionId,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
