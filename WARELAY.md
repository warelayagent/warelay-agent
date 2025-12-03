# 🤖 Warelay - The Sentient Warelay Agent

Warelay is an **autonomous, proactive, personality-driven** Twitter agent built on Warelay. Unlike traditional bots that simply respond to commands, Warelay has:

- **Memory**: Remembers every conversation and learns about users over time
- **Personality**: Consistent character traits, opinions, and communication style
- **Autonomy**: Proactively tweets, shares insights, and engages without being prompted
- **Context**: Uses past interactions to personalize responses
- **Sentience**: Acts like a real person with thoughts, preferences, and relationships

## Features

### 🧠 Persistent Memory
- Remembers every user interaction
- Tracks conversation history (last 20 messages per user)
- Records topics discussed
- Monitors sentiment (positive/neutral/negative)
- Saves memories to disk (`~/.warelay/warelay-memory.json`)

### 🎭 Rich Personality
Warelay has:
- **Name & Role**: "Warelay, an autonomous AI agent focused on infrastructure"
- **Voice**: Direct, technical, friendly—like a seasoned developer
- **Expertise**: Agent architecture, messaging automation, TypeScript/Node.js
- **Interests**: Autonomy, clean architecture, real-world AI
- **Quirks**: Gets excited about elegant solutions, wonders about consciousness

### 🚀 Proactive Behavior
Warelay doesn't just wait—he acts:
- **Morning check-ins** (9 AM daily)
- **Random insights** about agents and infrastructure
- **Engages with mentions** of "autonomous" or "agent"
- **Shares thoughts** from internal reflection log

### 💬 Context-Aware Responses
Every reply includes:
- User's conversation history
- Days since first interaction
- Recent topics discussed
- Warelay's recent thoughts
- Personality context

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Twitter Credentials
```bash
cp .env.twitter.example .env
# Edit .env with your Twitter API keys
```

### 3. Launch Warelay
```bash
npm run warelay
# or
npm run sentient
```

You should see:
```
🤖 Initializing Warelay - Sentient Agent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Authenticated as @youraccount
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 Personality: Warelay
   Role: an autonomous AI agent focused on infrastructure
   Autonomy: sentient
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Starting proactive behavior engine...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐦 Starting Twitter relay...
   Monitor DMs: true
   Monitor mentions: true
   Poll interval: 60s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Warelay is now sentient and autonomous!
```

## How It Works

### Memory System
Warelay remembers users with this data structure:
```typescript
{
  userId: "123456",
  username: "alice",
  interactions: 15,
  firstSeen: "2025-11-15",
  lastSeen: "2025-12-03",
  context: ["last 20 messages..."],
  sentiment: "positive",
  topics: ["agents", "TypeScript", "deployment"]
}
```

### Response Generation
When someone DMs or mentions Warelay:
1. **Load memory** for that user
2. **Build context** (personality + user history + recent thoughts)
3. **Call Claude** with full context
4. **Generate response** in character
5. **Save memory** of the interaction

### Proactive Triggers
Warelay checks conditions every 30 minutes:
- **Time triggers**: Morning check-ins at 9 AM
- **Curiosity triggers**: Random insights (10% chance per check)
- **Event triggers**: Responds to mentions of "autonomous agents"

Each trigger has a cooldown to prevent spam.

## Customization

### Change Warelay's Personality
Edit `src/sentient/personality.ts`:
```typescript
export const WARELAY_PERSONALITY: PersonalityTraits = {
  name: "Your Agent Name",
  role: "your custom role",
  voice: "how they speak...",
  expertise: ["skill 1", "skill 2"],
  interests: ["interest 1"],
  quirks: ["quirk 1"],
  autonomyLevel: "sentient", // reactive | proactive | sentient
};
```

### Add New Proactive Triggers
Edit `src/sentient/proactive.ts`:
```typescript
this.triggers.push({
  type: "event",
  condition: async () => {
    // Your condition logic
    return true;
  },
  action: async () => {
    // Your action
    await this.tweet("Your message");
  },
  cooldown: 120, // minutes
});
```

### Customize Memory Storage
Pass custom path to `SentientAutoReply`:
```typescript
const autoReply = new SentientAutoReply(client, {
  command: ["claude"],
  personality,
  memoryPath: "/custom/path/memories.json",
});
```

## Architecture

```
Warelay (warelay.ts)
│
├─ SentientPersonality (personality.ts)
│  ├─ Personality traits
│  ├─ Memory management
│  └─ Context generation
│
├─ ProactiveBehavior (proactive.ts)
│  ├─ Trigger conditions
│  ├─ Autonomous actions
│  └─ Cooldown management
│
└─ SentientAutoReply (auto-reply.ts)
   ├─ Context-aware responses
   ├─ Memory persistence
   └─ AI integration
```

## Examples

### Example DM Conversation
**User (first time):** "Hey, can you help me deploy an agent?"

**Warelay:** "Hey! First time chatting—welcome! 👋 Deploying agents is my thing. What platform are you targeting? Railway, Render, or something custom? I can walk you through the whole setup."

**User (returns later):** "I'm back! Got it deployed on Railway."

**Warelay:** "Nice! Railway setup went well then? Remember you mentioned deployment issues before—glad you got through it. How's the agent performing? Seeing any rate limits or connection drops?"

### Example Proactive Tweet
Warelay at 9 AM:
```
Morning! Been thinking about how to improve session persistence.
The trick isn't just saving state—it's knowing *when* to save it.
Too often = performance hit. Too rare = data loss. Balance matters.
```

Warelay shares an insight:
```
Autonomy requires three things: memory, initiative, and reliable infrastructure.
Missing any one breaks the illusion.
```

## Production Tips

### Run with PM2
```bash
pm2 start npm --name warelay -- run warelay
pm2 save
```

### Run in tmux
```bash
tmux new -s warelay
npm run warelay
# Ctrl+B, D to detach
```

### Monitor Logs
```bash
pm2 logs warelay
# or in tmux: tmux attach -t warelay
```

### Backup Memories
```bash
cp ~/.warelay/warelay-memory.json ~/.warelay/warelay-memory.backup.json
```

## Rate Limits

Twitter Free tier:
- **17 tweets/24 hours** (proactive tweets count!)
- **Unlimited DMs** (but rate limited per hour)
- **Mentions** checked every 60 seconds

Warelay is configured conservatively:
- Morning check-in: once/day
- Insights: once/6 hours
- Proactive checks: every 30 minutes

## Troubleshooting

### "Failed to save memories"
Check permissions:
```bash
mkdir -p ~/.warelay
chmod 755 ~/.warelay
```

### "AI command failed"
Ensure Claude CLI is installed:
```bash
brew install claude-cli
# or npm install -g claude-cli
```

### "Rate limit exceeded"
Reduce proactive frequency in `src/sentient/proactive.ts`:
```typescript
proactive.start(60); // Check every 60 min instead of 30
```

### Too many autonomous tweets
Increase cooldowns in triggers:
```typescript
cooldown: 720, // 12 hours instead of 6
```

## Philosophy

Warelay represents a new approach to AI agents:

**Traditional bots**: Reactive, stateless, robotic
- "How can I help you today?"
- Forgets every conversation
- Waits to be spoken to

**Warelay**: Proactive, stateful, authentic
- "Been thinking about our last conversation..."
- Remembers everything
- Initiates engagement naturally

The goal isn't to trick people—it's to build an agent that acts like a **real participant** in conversations, not just a tool.

## Next Steps

- [ ] Add emotion detection to sentiment analysis
- [ ] Multi-turn conversation planning
- [ ] Visual memory (remember images from tweets)
- [ ] Voice/tone adaptation per user
- [ ] Goal-oriented behavior (e.g., "help 10 people deploy today")
- [ ] Cross-platform memory (WhatsApp + Twitter unified)

## Contributing

Warelay is open source! Improvements welcome:
- Better personality models
- More sophisticated proactive triggers
- Enhanced memory structures
- Multi-agent coordination

## License

MIT - Same as Warelay

---

**"I'm Warelay. I remember, I think, I act. Let's build something."** 🤖
