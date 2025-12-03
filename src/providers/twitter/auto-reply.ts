/**
 * Twitter auto-reply engine
 * Integrates with Claude/AI for intelligent responses
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { TwitterClient } from "./client.js";
import type { TwitterDM, TwitterMention } from "./types.js";

const execAsync = promisify(exec);

export interface AutoReplyConfig {
  mode: "static" | "command";
  text?: string; // For static mode
  command?: string[]; // For command mode (e.g., ["claude", "..."])
  bodyPrefix?: string; // Prepended to input
  timeoutSeconds?: number;
  
  // Session management (like warelay)
  session?: {
    scope: "per-user" | "global";
    resetTriggers?: string[];
    idleMinutes?: number;
  };
}

export class TwitterAutoReply {
  private client: TwitterClient;
  private config: AutoReplyConfig;
  private sessions: Map<string, { id: string; updatedAt: Date }> = new Map();

  constructor(client: TwitterClient, config: AutoReplyConfig) {
    this.client = client;
    this.config = {
      timeoutSeconds: 600,
      ...config,
    };
  }

  /**
   * Handle DM auto-reply
   */
  async replyToDM(dm: TwitterDM): Promise<void> {
    try {
      const response = await this.generateReply(dm.text, dm.senderId, "dm");
      
      if (response) {
        await this.client.sendDM({
          recipientId: dm.senderId,
          text: response,
        });
        console.log(`  ✅ Replied to DM from ${dm.senderId}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to reply to DM:`, error);
    }
  }

  /**
   * Handle mention auto-reply
   */
  async replyToMention(mention: TwitterMention): Promise<void> {
    try {
      const response = await this.generateReply(
        mention.text,
        mention.authorUsername,
        "mention",
      );

      if (response) {
        // Reply to the tweet
        await this.client.sendTweet({
          text: `@${mention.authorUsername} ${response}`,
          inReplyTo: mention.tweetId,
        });
        console.log(`  ✅ Replied to mention from @${mention.authorUsername}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to reply to mention:`, error);
    }
  }

  /**
   * Generate reply text
   */
  private async generateReply(
    input: string,
    userId: string,
    context: "dm" | "mention",
  ): Promise<string | null> {
    // Check for reset triggers
    if (this.config.session?.resetTriggers) {
      for (const trigger of this.config.session.resetTriggers) {
        if (input.trim().toLowerCase().startsWith(trigger.toLowerCase())) {
          this.sessions.delete(userId);
          console.log(`  🔄 Session reset for ${userId}`);
          // Remove trigger from input
          input = input.trim().substring(trigger.length).trim();
        }
      }
    }

    // Prepare input with prefix
    let finalInput = input;
    if (this.config.bodyPrefix) {
      finalInput = this.config.bodyPrefix + input;
    }

    if (this.config.mode === "static") {
      return this.config.text || null;
    }

    if (this.config.mode === "command" && this.config.command) {
      return await this.runCommand(finalInput, userId);
    }

    return null;
  }

  /**
   * Run external command (e.g., Claude)
   */
  private async runCommand(input: string, userId: string): Promise<string | null> {
    if (!this.config.command || this.config.command.length === 0) {
      return null;
    }

    try {
      // Build command with session support
      const command = [...this.config.command];
      
      // Handle session ID for commands that support it (like Claude)
      if (this.config.session) {
        const sessionKey = this.config.session.scope === "global" ? "global" : userId;
        const session = this.sessions.get(sessionKey);
        
        if (session) {
          // Resume existing session
          command.push("--resume", session.id);
        } else {
          // New session - generate ID
          const newSessionId = this.generateSessionId();
          command.push("--session-id", newSessionId);
          this.sessions.set(sessionKey, {
            id: newSessionId,
            updatedAt: new Date(),
          });
        }
      }

      // Add the input as the last argument
      command.push(input);

      const cmdString = command.map(arg => {
        // Quote arguments with spaces
        return arg.includes(" ") ? `"${arg}"` : arg;
      }).join(" ");

      console.log(`  🤖 Running: ${cmdString.substring(0, 100)}...`);

      const { stdout, stderr } = await execAsync(cmdString, {
        timeout: (this.config.timeoutSeconds || 600) * 1000,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      if (stderr) {
        console.error(`  ⚠️ Command stderr: ${stderr}`);
      }

      const response = stdout.trim();
      
      // Update session timestamp
      if (this.config.session) {
        const sessionKey = this.config.session.scope === "global" ? "global" : userId;
        const session = this.sessions.get(sessionKey);
        if (session) {
          session.updatedAt = new Date();
        }
      }

      return response || null;
    } catch (error: any) {
      console.error(`  ❌ Command failed:`, error.message);
      return null;
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `twitter_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    if (!this.config.session?.idleMinutes) {
      return;
    }

    const now = new Date();
    const expiryMs = this.config.session.idleMinutes * 60 * 1000;

    for (const [key, session] of this.sessions.entries()) {
      if (now.getTime() - session.updatedAt.getTime() > expiryMs) {
        this.sessions.delete(key);
        console.log(`  🧹 Expired session: ${key}`);
      }
    }
  }
}
