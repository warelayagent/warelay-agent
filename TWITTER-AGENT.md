# 🐦 Warelay Agent (Twitter) - Automated Twitter Bot

Built on the warelay framework, Warelay Agent extends multi-platform messaging automation to Twitter. Automate tweets, DMs, monitoring, and AI-powered auto-replies.

## Features

- 📝 **Post tweets** - Send tweets, replies, quotes with media
- 💌 **Send DMs** - Direct message users with text and media
- 🔔 **Monitor mentions** - Track when people mention you
- 📨 **Monitor DMs** - Watch for incoming direct messages
- 🤖 **Auto-reply** - Respond automatically using Claude or other AI
- 🎯 **Smart filtering** - Allow/block specific users
- 💾 **Session memory** - Multi-turn conversations with context
- ⚡ **Rate limiting** - Built-in protection from API limits

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm install twitter-api-v2
```

### 2. Get Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create an app and get your credentials
3. Copy `.env.example` to `.env` and fill in:

```bash
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```

### 3. Run Commands

```bash
# Post a tweet
npx tsx src/warelay-agent.ts tweet --text "Hello from my Twitter agent!"

# Send a DM
npx tsx src/warelay-agent.ts dm --to username --message "Hi there!"

# Check status
npx tsx src/warelay-agent.ts status --verbose

# Start monitoring (relay mode)
npx tsx src/warelay-agent.ts relay --verbose
```

## Commands

### `tweet` - Post a Tweet

```bash
# Simple tweet
npx tsx src/warelay-agent.ts tweet --text "Hello world!"

# Reply to a tweet
npx tsx src/warelay-agent.ts tweet --text "Great point!" --reply-to 1234567890

# Quote tweet
npx tsx src/warelay-agent.ts tweet --text "Interesting!" --quote 1234567890

# Tweet with media
npx tsx src/warelay-agent.ts tweet --text "Check this out!" --media ./photo.jpg

# Dry run (test without posting)
npx tsx src/warelay-agent.ts tweet --text "Test" --dry-run
```

### `dm` - Send Direct Message

```bash
# Send DM by username
npx tsx src/warelay-agent.ts dm --to username --message "Hey!"

# Send DM by user ID
npx tsx src/warelay-agent.ts dm --to 12345678 --message "Hi"

# DM with media
npx tsx src/warelay-agent.ts dm --to username --message "Check this" --media ./image.jpg

# Dry run
npx tsx src/warelay-agent.ts dm --to username --message "Test" --dry-run
```

### `relay` - Monitor and Auto-Reply

```bash
# Basic monitoring (no auto-reply)
npx tsx src/warelay-agent.ts relay

# With custom config
npx tsx src/warelay-agent.ts relay --config ./my-config.json

# Custom poll interval (default 60s)
npx tsx src/warelay-agent.ts relay --interval 30

# Verbose mode
npx tsx src/warelay-agent.ts relay --verbose
```

### `status` - Check Account Status

```bash
# Basic info
npx tsx src/warelay-agent.ts status

# With recent activity
npx tsx src/warelay-agent.ts status --verbose
```

### `search` - Search Tweets

```bash
# Search for keyword
npx tsx src/warelay-agent.ts search --query "AI agents"

# Limit results
npx tsx src/warelay-agent.ts search --query "AI" --limit 10
```

## Configuration

Create `~/.warelay/twitter.json` for auto-reply configuration:

### Example: Claude-Powered Auto-Reply

```json
{
  "monitorDMs": true,
  "monitorMentions": true,
  "autoReplyDMs": true,
  "autoReplyMentions": true,
  "allowedUsers": ["*"],
  "autoReply": {
    "mode": "command",
    "command": ["claude", "--dangerously-skip-permissions"],
    "bodyPrefix": "You are a helpful Twitter assistant. Keep responses under 280 characters.\n\n",
    "timeoutSeconds": 30,
    "session": {
      "scope": "per-user",
      "resetTriggers": ["/new"],
      "idleMinutes": 60
    }
  }
}
```

### Example: Simple Auto-Reply

```json
{
  "monitorDMs": true,
  "autoReplyDMs": true,
  "allowedUsers": ["friend1", "friend2"],
  "autoReply": {
    "mode": "static",
    "text": "Thanks for your message! I'll respond soon."
  }
}
```

See [docs/twitter-config.md](docs/twitter-config.md) for more examples.

## How It Works

### Architecture

The Twitter agent is built on warelay's provider pattern:

```
┌─────────────────────────────────────────┐
│         Twitter Agent CLI               │
│  (src/twitter-agent.ts)                 │
└────────────┬────────────────────────────┘
             │
             ├─> Commands
             │   ├─> tweet (src/commands/twitter-tweet.ts)
             │   ├─> dm (src/commands/twitter-dm.ts)
             │   ├─> relay (src/commands/twitter-relay.ts)
             │   └─> status
             │
             └─> Twitter Provider
                 ├─> Client (src/providers/twitter/client.ts)
                 ├─> Relay (src/providers/twitter/relay.ts)
                 └─> Auto-Reply (src/providers/twitter/auto-reply.ts)
```

### Relay Loop

1. Poll Twitter API every N seconds (configurable)
2. Check for new DMs and mentions
3. Filter by allowed/blocked users
4. Trigger auto-reply handler if configured
5. Run command (e.g., Claude) with message text
6. Send response back to user
7. Save state (last processed IDs) to disk

### Session Management

- **Per-user sessions**: Each user gets their own conversation context
- **Global session**: All users share one conversation
- **Reset triggers**: Keywords like `/new` reset the conversation
- **Idle timeout**: Sessions expire after inactivity

## Use Cases

### Personal Assistant Bot

Monitor your DMs and auto-respond with Claude:

```json
{
  "monitorDMs": true,
  "autoReplyDMs": true,
  "allowedUsers": ["*"],
  "autoReply": {
    "mode": "command",
    "command": ["claude"],
    "bodyPrefix": "You are my personal assistant. Help with scheduling, reminders, and questions.\n\n"
  }
}
```

### Customer Support Bot

Auto-respond to mentions with helpful info:

```json
{
  "monitorMentions": true,
  "autoReplyMentions": true,
  "autoReply": {
    "mode": "command",
    "command": ["claude"],
    "bodyPrefix": "You are a customer support agent. Be helpful and concise.\n\n"
  }
}
```

### Content Monitor

Track mentions and keywords without auto-reply:

```json
{
  "monitorMentions": true,
  "monitorKeywords": ["AI", "automation"],
  "autoReplyMentions": false
}
```

## Rate Limits

Twitter API rate limits (free tier):

- **Tweets**: 50 per day
- **DMs**: 500 per day
- **API calls**: Various limits per endpoint

The agent includes rate limiting protection in the config:

```json
{
  "maxTweetsPerHour": 50,
  "maxDMsPerHour": 100
}
```

## Safety Tips

- **Test with `--dry-run`** before posting
- **Use `allowedUsers`** to restrict who can trigger auto-replies
- **Set reasonable poll intervals** (60s+ recommended)
- **Monitor API usage** in Twitter Developer Portal
- **Keep sessions scoped** to avoid context leakage
- **Use timeouts** to prevent long-running commands

## Troubleshooting

### Authentication Errors

```
❌ Missing Twitter credentials in environment!
```

**Solution**: Make sure `.env` has all required credentials

### Rate Limit Errors

```
❌ Error 429: Too Many Requests
```

**Solution**: Increase poll interval, reduce activity, or upgrade API tier

### Command Timeout

```
❌ Command failed: timeout
```

**Solution**: Increase `timeoutSeconds` in config or optimize your command

## Advanced: Deploy to Production

### Using systemd (Linux)

Create `/etc/systemd/system/twitter-agent.service`:

```ini
[Unit]
Description=Twitter Agent Relay
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/warelay-main
Environment="NODE_ENV=production"
EnvironmentFile=/path/to/.env
ExecStart=/usr/bin/npx tsx src/warelay-agent.ts relay
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable twitter-agent
sudo systemctl start twitter-agent
sudo systemctl status twitter-agent
```

### Using PM2 (Node.js process manager)

```bash
# Install PM2
npm install -g pm2

# Start agent
pm2 start src/twitter-agent.ts --interpreter tsx -- relay --verbose

# Save process list
pm2 save

# Auto-start on boot
pm2 startup
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npx", "tsx", "src/twitter-agent.ts", "relay", "--verbose"]
```

Build and run:

```bash
docker build -t twitter-agent .
docker run -d --env-file .env --name twitter-agent twitter-agent
```

## Contributing

This is built on the warelay framework. To add features:

1. **New providers**: Add to `src/providers/`
2. **New commands**: Add to `src/commands/`
3. **Tests**: Use `pnpm test`
4. **Lint**: Run `pnpm lint`

## License

MIT - Same as warelay

## Links

- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [twitter-api-v2 Library](https://github.com/PLhery/node-twitter-api-v2)
- [warelay Framework](https://github.com/steipete/warelay)
- [Claude CLI](https://github.com/anthropics/anthropic-cli)
