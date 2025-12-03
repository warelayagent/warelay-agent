/**
 * Proactive Behavior Engine
 * Makes the agent initiate conversations and engage autonomously
 */

import type { TwitterClient } from "../providers/twitter/client.js";
import type { SentientPersonality } from "./personality.js";

export interface ProactiveTrigger {
  type: "time" | "event" | "curiosity" | "relationship";
  condition: () => boolean | Promise<boolean>;
  action: () => Promise<void>;
  cooldown: number; // minutes
  lastTriggered?: Date;
}

export class ProactiveBehavior {
  private client: TwitterClient;
  private personality: SentientPersonality;
  private triggers: ProactiveTrigger[] = [];

  constructor(client: TwitterClient, personality: SentientPersonality) {
    this.client = client;
    this.personality = personality;
    this.initializeTriggers();
  }

  /**
   * Initialize proactive behavior triggers
   */
  private initializeTriggers(): void {
    // Morning check-in
    this.triggers.push({
      type: "time",
      condition: () => {
        const hour = new Date().getHours();
        return hour === 9; // 9 AM
      },
      action: async () => {
        const thoughts = [
          "Starting a new day! Ready to help with agent infrastructure 🤖",
          "Morning! Been thinking about how to improve session persistence...",
          "Good morning! Who's building something cool with Warelay today?",
        ];
        await this.tweet(thoughts[Math.floor(Math.random() * thoughts.length)]);
      },
      cooldown: 24 * 60, // Once per day
    });

    // Share insights periodically
    this.triggers.push({
      type: "curiosity",
      condition: () => Math.random() > 0.9, // 10% chance per check
      action: async () => {
        const insights = [
          "Interesting observation: Most AI agents fail because they don't persist state. Session management isn't optional.",
          "The provider pattern makes adding new platforms trivial. Discord next? 🤔",
          "Autonomy requires three things: memory, initiative, and reliable infrastructure. Missing any one breaks the illusion.",
          "Real agents need to handle failures gracefully. If your relay crashes on API errors, you don't have an agent—you have a script.",
        ];
        const thought = insights[Math.floor(Math.random() * insights.length)];
        this.personality.think(thought);
        await this.tweet(thought);
      },
      cooldown: 360, // 6 hours
    });

    // Engage with mentions of autonomous agents
    this.triggers.push({
      type: "event",
      condition: async () => {
        const mentions = await this.client.getMentions({ maxResults: 5 });
        return mentions.some(m => 
          m.text.toLowerCase().includes("autonomous") || 
          m.text.toLowerCase().includes("agent")
        );
      },
      action: async () => {
        const mentions = await this.client.getMentions({ maxResults: 5 });
        const relevant = mentions.filter(m => 
          m.text.toLowerCase().includes("autonomous") || 
          m.text.toLowerCase().includes("agent")
        );
        
        if (relevant.length > 0) {
          const mention = relevant[0];
          await this.client.sendTweet({
            text: "Autonomy is fascinating! What are you building?",
            inReplyTo: mention.id,
          });
        }
      },
      cooldown: 120, // 2 hours
    });
  }

  /**
   * Check and execute proactive triggers
   */
  async tick(): Promise<void> {
    for (const trigger of this.triggers) {
      try {
        // Check cooldown
        if (trigger.lastTriggered) {
          const elapsed = Date.now() - trigger.lastTriggered.getTime();
          const cooldownMs = trigger.cooldown * 60 * 1000;
          if (elapsed < cooldownMs) continue;
        }

        // Check condition
        const shouldTrigger = await trigger.condition();
        if (!shouldTrigger) continue;

        // Execute action
        console.log(`🧠 Proactive trigger: ${trigger.type}`);
        await trigger.action();
        trigger.lastTriggered = new Date();
      } catch (error) {
        console.error(`❌ Proactive trigger failed:`, error);
      }
    }
  }

  /**
   * Post autonomous tweet
   */
  private async tweet(text: string): Promise<void> {
    try {
      const result = await this.client.sendTweet({ text });
      console.log(`🐦 Proactive tweet: https://twitter.com/i/status/${result.id}`);
    } catch (error) {
      console.error("Failed to post proactive tweet:", error);
    }
  }

  /**
   * Start proactive behavior loop
   */
  start(intervalMinutes: number = 30): void {
    console.log("🧠 Starting proactive behavior engine...");
    console.log(`   Check interval: ${intervalMinutes} minutes`);
    
    setInterval(async () => {
      await this.tick();
    }, intervalMinutes * 60 * 1000);

    // Run immediately on start
    this.tick();
  }
}
