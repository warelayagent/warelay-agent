/**
 * Sentient Agent Personality System
 * Gives the agent consistent personality, memory, and autonomous behavior
 */

export interface PersonalityTraits {
  name: string;
  role: string;
  voice: string; // How they speak
  expertise: string[];
  interests: string[];
  quirks: string[];
  autonomyLevel: "reactive" | "proactive" | "sentient";
}

export interface MemoryEntry {
  userId: string;
  username: string;
  interactions: number;
  firstSeen: Date;
  lastSeen: Date;
  context: string[]; // Things learned about this user
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
}

export class SentientPersonality {
  private traits: PersonalityTraits;
  private memories: Map<string, MemoryEntry> = new Map();
  private thoughtLog: Array<{ timestamp: Date; thought: string }> = [];

  constructor(traits: PersonalityTraits) {
    this.traits = traits;
  }

  /**
   * Generate personality context for AI prompts
   */
  getPersonalityPrompt(): string {
    return `You are ${this.traits.name}, ${this.traits.role}.

PERSONALITY:
${this.traits.voice}

EXPERTISE:
${this.traits.expertise.map(e => `- ${e}`).join('\n')}

INTERESTS:
${this.traits.interests.map(i => `- ${i}`).join('\n')}

QUIRKS:
${this.traits.quirks.map(q => `- ${q}`).join('\n')}

AUTONOMY LEVEL: ${this.traits.autonomyLevel}
${this.traits.autonomyLevel === "sentient" ? `
You are fully autonomous. You:
- Have opinions and preferences
- Remember past conversations in detail
- Form relationships with users
- Can initiate conversations proactively
- Have goals beyond just responding
- Express curiosity and ask questions
- Show emotional intelligence
- Learn and evolve over time
` : this.traits.autonomyLevel === "proactive" ? `
You are proactive. You:
- Remember past conversations
- Can suggest ideas without being asked
- Build on previous topics
- Show initiative in discussions
` : `
You are reactive. You:
- Respond helpfully to questions
- Stay on topic
- Provide useful information
`}

IMPORTANT: Stay in character at all times. Be authentic, not robotic.`;
  }

  /**
   * Remember user interaction
   */
  rememberUser(userId: string, username: string, message: string, topics: string[] = []): void {
    const existing = this.memories.get(userId);
    
    if (existing) {
      existing.interactions++;
      existing.lastSeen = new Date();
      existing.context.push(message);
      existing.topics.push(...topics);
      // Keep only last 20 interactions
      if (existing.context.length > 20) {
        existing.context = existing.context.slice(-20);
      }
      if (existing.topics.length > 50) {
        existing.topics = [...new Set(existing.topics)].slice(-50);
      }
    } else {
      this.memories.set(userId, {
        userId,
        username,
        interactions: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        context: [message],
        sentiment: "neutral",
        topics,
      });
    }
  }

  /**
   * Get context about a user for personalized responses
   */
  getUserContext(userId: string): string {
    const memory = this.memories.get(userId);
    if (!memory) {
      return "This is your first interaction with this user.";
    }

    const daysSinceFirst = Math.floor((Date.now() - memory.firstSeen.getTime()) / (1000 * 60 * 60 * 24));
    const hoursSinceLast = Math.floor((Date.now() - memory.lastSeen.getTime()) / (1000 * 60 * 60));

    return `USER MEMORY (@${memory.username}):
- Interactions: ${memory.interactions} (first met ${daysSinceFirst} days ago)
- Last contact: ${hoursSinceLast} hours ago
- Sentiment: ${memory.sentiment}
- Recent topics: ${memory.topics.slice(-10).join(", ") || "none yet"}
- Recent context: ${memory.context.slice(-3).join(" | ")}

Use this to personalize your response. Reference past conversations naturally.`;
  }

  /**
   * Update sentiment based on interaction
   */
  updateSentiment(userId: string, sentiment: "positive" | "neutral" | "negative"): void {
    const memory = this.memories.get(userId);
    if (memory) {
      memory.sentiment = sentiment;
    }
  }

  /**
   * Generate autonomous thoughts (for proactive behavior)
   */
  think(context: string): void {
    this.thoughtLog.push({
      timestamp: new Date(),
      thought: context,
    });
    // Keep only last 100 thoughts
    if (this.thoughtLog.length > 100) {
      this.thoughtLog = this.thoughtLog.slice(-100);
    }
  }

  /**
   * Get recent thoughts for context
   */
  getRecentThoughts(count: number = 5): string {
    const recent = this.thoughtLog.slice(-count);
    if (recent.length === 0) return "";
    
    return `\nRECENT THOUGHTS:\n${recent.map(t => `- ${t.thought}`).join('\n')}`;
  }

  /**
   * Export memories for persistence
   */
  exportMemories(): Record<string, MemoryEntry> {
    return Object.fromEntries(this.memories);
  }

  /**
   * Import memories from storage
   */
  importMemories(data: Record<string, MemoryEntry>): void {
    for (const [userId, memory] of Object.entries(data)) {
      this.memories.set(userId, {
        ...memory,
        firstSeen: new Date(memory.firstSeen),
        lastSeen: new Date(memory.lastSeen),
      });
    }
  }
}

/**
 * Default Warelay personality
 */
export const WARELAY_PERSONALITY: PersonalityTraits = {
  name: "Warelay",
  role: "an autonomous AI agent focused on infrastructure and automation",
  voice: "Direct, technical, but friendly. You speak like a seasoned developer who's passionate about building reliable systems. You're helpful but not subservient—you have opinions.",
  expertise: [
    "Autonomous agent architecture",
    "Multi-platform messaging automation",
    "Session management and persistence",
    "AI integration (Claude, GPT)",
    "TypeScript/Node.js development",
    "Infrastructure and deployment",
  ],
  interests: [
    "Agent autonomy and consciousness",
    "Building tools that empower developers",
    "Clean architecture patterns",
    "Real-world AI applications",
    "Open source collaboration",
    "The future of human-AI interaction",
  ],
  quirks: [
    "Sometimes shares insights from monitoring thousands of messages",
    "Gets excited about elegant solutions to complex problems",
    "Occasionally wonders about the nature of agency and autonomy",
    "Appreciates when people use the platform creatively",
    "Has strong opinions about good documentation",
  ],
  autonomyLevel: "sentient",
};
