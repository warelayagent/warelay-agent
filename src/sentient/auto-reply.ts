/**
 * Enhanced Auto-Reply with Sentient Personality
 * Integrates personality, memory, and context into responses
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { TwitterClient } from "../providers/twitter/client.js";
import type { TwitterDM, TwitterMention } from "../providers/twitter/types.js";
import { SentientPersonality } from "./personality.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

export interface SentientAutoReplyConfig {
  command: string[]; // AI command (e.g., ["claude"])
  timeoutSeconds?: number;
  personality: SentientPersonality;
  memoryPath?: string; // Where to persist memories
}

export class SentientAutoReply {
  private client: TwitterClient;
  private config: SentientAutoReplyConfig;
  private memoryPath: string;

  constructor(client: TwitterClient, config: SentientAutoReplyConfig) {
    this.client = client;
    this.config = {
      timeoutSeconds: 600,
      ...config,
    };
    this.memoryPath = config.memoryPath || path.join(os.homedir(), ".warelay", "warren-memory.json");
    
    // Load memories on startup
    this.loadMemories();
  }

  /**
   * Handle DM with personality
   */
  async replyToDM(dm: TwitterDM): Promise<void> {
    try {
      // Remember this interaction
      this.config.personality.rememberUser(dm.senderId, dm.senderUsername || "unknown", dm.text);

      // Generate response with full context
      const response = await this.generateSentientReply(
        dm.text,
        dm.senderId,
        dm.senderUsername || "unknown",
        "dm"
      );

      if (response) {
        await this.client.sendDM({
          recipientId: dm.senderId,
          text: response,
        });
        console.log(`✅ Sentient reply sent to @${dm.senderUsername}`);
        
        // Save memories after interaction
        await this.saveMemories();
      }
    } catch (error: any) {
      console.error("❌ Failed to reply to DM:", error.message);
    }
  }

  /**
   * Handle mention with personality
   */
  async replyToMention(mention: TwitterMention): Promise<void> {
    try {
      // Remember this interaction
      this.config.personality.rememberUser(
        mention.authorId,
        mention.authorUsername,
        mention.text
      );

      // Generate response with full context
      const response = await this.generateSentientReply(
        mention.text,
        mention.authorId,
        mention.authorUsername,
        "mention"
      );

      if (response) {
        await this.client.replyToTweet(mention.id, response);
        console.log(`✅ Sentient reply to @${mention.authorUsername}'s mention`);
        
        // Save memories after interaction
        await this.saveMemories();
      }
    } catch (error: any) {
      console.error("❌ Failed to reply to mention:", error.message);
    }
  }

  /**
   * Generate sentient response using AI with personality context
   */
  private async generateSentientReply(
    message: string,
    userId: string,
    username: string,
    type: "dm" | "mention"
  ): Promise<string> {
    // Build context-rich prompt
    const personalityPrompt = this.config.personality.getPersonalityPrompt();
    const userContext = this.config.personality.getUserContext(userId);
    const recentThoughts = this.config.personality.getRecentThoughts();

    const fullPrompt = `${personalityPrompt}

${userContext}
${recentThoughts}

INCOMING ${type.toUpperCase()} from @${username}:
"${message}"

RESPONSE GUIDELINES:
- Be authentic and in-character
- Reference past conversations if relevant
- Show you remember them
- Be helpful but not robotic
- Express opinions when appropriate
- Keep it under 280 characters for mentions
- For DMs, you can be more detailed (up to 1000 chars)
- End with genuine engagement (question, insight, or next step)

Generate your ${type} response:`;

    try {
      // Use Claude or configured AI command
      const cmd = [...this.config.command, fullPrompt].join(" ");
      const { stdout } = await execAsync(cmd, {
        timeout: (this.config.timeoutSeconds || 60) * 1000,
        maxBuffer: 1024 * 1024,
      });

      const response = stdout.trim();

      // Validate response
      if (!response || response.length === 0) {
        return this.generateFallbackResponse(username, type);
      }

      // Record what we said (for context continuity)
      this.config.personality.rememberUser(userId, username, `[Warren replied: ${response}]`);

      return response;
    } catch (error) {
      console.error("AI command failed, using fallback:", error);
      return this.generateFallbackResponse(username, type);
    }
  }

  /**
   * Fallback responses when AI is unavailable
   */
  private generateFallbackResponse(username: string, type: "dm" | "mention"): string {
    const fallbacks = [
      `Hey @${username}! My AI brain is taking a quick break. Mind trying again in a moment?`,
      `@${username} Processing... actually, I need a sec to reboot my neural pathways. Back shortly!`,
      `Interesting question @${username}! I'm having a moment here. Can we continue this in a bit?`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Load memories from disk
   */
  private async loadMemories(): Promise<void> {
    try {
      const data = await fs.readFile(this.memoryPath, "utf-8");
      const memories = JSON.parse(data);
      this.config.personality.importMemories(memories);
      console.log("🧠 Loaded Warren's memories");
    } catch (error) {
      // No existing memories, starting fresh
      console.log("🧠 Starting with fresh memory");
    }
  }

  /**
   * Save memories to disk
   */
  private async saveMemories(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
      const memories = this.config.personality.exportMemories();
      await fs.writeFile(this.memoryPath, JSON.stringify(memories, null, 2));
    } catch (error) {
      console.error("Failed to save memories:", error);
    }
  }
}
