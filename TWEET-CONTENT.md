# Custom Tweet Content

Edit this file to customize your automated tweets. The scheduler will post these with configurable delays.

## Launch Tweets (Product Introduction)

```typescript
"🤖 Introducing Warelay Agent - autonomous AI infrastructure for Twitter & WhatsApp.

Monitor DMs, auto-reply with Claude/GPT, deploy in minutes.

Open source • TypeScript • AI-powered

github.com/warelayagent/warelay-agent"
```

```typescript
"Building autonomous AI agents that remember, persist, and operate 24/7 🤖

Warelay Agent = Infrastructure for digital minds

Open source, built with TypeScript, AI-powered

github.com/warelayagent/warelay-agent"
```

## Feature Highlights

```typescript
"🔥 Warelay Agent features:

✅ Twitter DM & mention monitoring
✅ WhatsApp integration (Twilio/Baileys)
✅ AI auto-reply (Claude, GPT, custom)
✅ Session management per user
✅ One-click deploy to Railway/Render

Docs: github.com/warelayagent/warelay-agent"
```

## Technical Deep Dives

```typescript
"Warelay Agent architecture:

• Provider pattern for platform abstraction
• Session management with configurable scopes
• Auto-reply engine (static/command modes)
• Hot-loadable capabilities
• Background monitoring with state tracking

Built for scale."
```

## Community Engagement

```typescript
"Who's Warelay Agent for?

👨‍🔬 Researchers studying AI behavior
🏗️ Builders deploying production agents
🤖 Anyone wanting autonomous AI assistants

Open source, MIT licensed, built for everyone.

github.com/warelayagent/warelay-agent"
```

---

## Usage

### Preview tweets (dry run):
```bash
npx tsx src/tweet-scheduler.ts launch --dry-run
```

### Post launch tweets (with 2hr delays):
```bash
npx tsx src/tweet-scheduler.ts launch
```

### Post feature tweets:
```bash
npx tsx src/tweet-scheduler.ts features
```

### Post technical tweets:
```bash
npx tsx src/tweet-scheduler.ts technical
```

### Post community tweets:
```bash
npx tsx src/tweet-scheduler.ts community
```

## Customization

1. Edit `src/tweet-scheduler.ts`
2. Add/modify tweets in the `tweetTemplates` object
3. Adjust delays between tweets (default: 120 minutes)
4. Run with `--dry-run` to preview

## Tips

- Keep tweets under 280 characters
- Use line breaks for readability
- Include calls to action
- Add relevant hashtags
- Tag relevant accounts
- Use emojis strategically
- Test with --dry-run first
