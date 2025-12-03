# Warelay Agent (Twitter) - Quick Reference

## Installation
```bash
npm install
npm install twitter-api-v2  # ✅ Already installed
```

## Setup
```bash
# 1. Get credentials from https://developer.twitter.com
# 2. Create .env file
cp .env.twitter.example .env
# Edit .env with your Twitter API credentials

# 3. Test authentication
npm run warelay-agent status
```

## Commands

### Tweet
```bash
# Basic tweet
npm run warelay-agent tweet --text "Hello world!"

# Reply to tweet
npm run warelay-agent tweet --text "Great!" --reply-to 1234567890

# Quote tweet
npm run warelay-agent tweet --text "Interesting" --quote 1234567890

# With media
npm run warelay-agent tweet --text "Check this" --media ./photo.jpg

# Dry run (test)
npm run warelay-agent tweet --text "Test" --dry-run
```

### Direct Message
```bash
# By username
npm run warelay-agent dm --to username --message "Hi!"

# By user ID
npm run warelay-agent dm --to 123456789 --message "Hello"

# With media
npm run warelay-agent dm --to user --message "Look" --media ./file.jpg
```

### Relay (Monitor & Auto-Reply)
```bash
# Basic monitoring
npm run warelay-agent relay

# With config file
npm run warelay-agent relay --config ~/.warelay/twitter.json

# Custom interval (default 60s)
npm run warelay-agent relay --interval 30

# Verbose logging
npm run warelay-agent relay --verbose
```

### Status
```bash
# Basic info
npm run warelay-agent status

# With recent activity
npm run warelay-agent status --verbose
```

### Search
```bash
npm run warelay-agent search --query "AI agents"
npm run warelay-agent search --query "AI" --limit 10
```

## Configuration

Create `~/.warelay/twitter.json`:

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
    "bodyPrefix": "You are a Twitter assistant. Keep responses under 280 characters.\n\n",
    "timeoutSeconds": 30,
    "session": {
      "scope": "per-user",
      "resetTriggers": ["/new"],
      "idleMinutes": 60
    }
  }
}
```

## Auto-Reply Modes

### Static Text
```json
{
  "autoReply": {
    "mode": "static",
    "text": "Thanks! I'll respond soon."
  }
}
```

### AI Command (Claude)
```json
{
  "autoReply": {
    "mode": "command",
    "command": ["claude"],
    "bodyPrefix": "You are a helpful assistant.\n\n"
  }
}
```

### OpenAI GPT
```json
{
  "autoReply": {
    "mode": "command",
    "command": ["openai", "chat", "completions", "create", "--model", "gpt-4"],
    "bodyPrefix": "System: You are a Twitter bot.\n\n"
  }
}
```

## User Filtering

```json
{
  // Allow everyone
  "allowedUsers": ["*"],
  
  // Allow specific users only
  "allowedUsers": ["friend1", "friend2"],
  
  // Block specific users
  "blockedUsers": ["spammer1", "troll2"]
}
```

## Session Management

```json
{
  "session": {
    // Per-user: separate conversation per user
    // Global: one shared conversation
    "scope": "per-user",
    
    // Reset triggers (keywords)
    "resetTriggers": ["/new", "/reset"],
    
    // Idle timeout (minutes)
    "idleMinutes": 60
  }
}
```

## Deployment

### PM2 (Process Manager)
```bash
pm2 start npm --name twitter-agent -- run twitter-agent relay
pm2 logs twitter-agent
pm2 restart twitter-agent
pm2 stop twitter-agent
```

### tmux (Simple Background)
```bash
tmux new -s twitter-agent
npm run warelay-agent relay --verbose
# Detach: Ctrl+B, D
# Reattach: tmux attach -t twitter-agent
```

### systemd (Linux Service)
```bash
sudo systemctl enable twitter-agent
sudo systemctl start twitter-agent
sudo systemctl status twitter-agent
```

## Troubleshooting

### Authentication Error
```bash
# Check .env file exists and has all credentials
cat .env | grep TWITTER
```

### Rate Limit Error
```bash
# Increase poll interval
npm run warelay-agent relay --interval 120
```

### Permission Error
```bash
# In Twitter Developer Portal:
# 1. App Settings → User authentication settings
# 2. Set permissions to "Read, Write, and Direct Messages"
# 3. Regenerate access tokens
```

### Claude Not Found
```bash
# Install Claude CLI
brew install anthropic-ai/cli/claude
claude login
```

## Files & Directories

```
~/.warelay/
├── twitter.json          # Main config
├── twitter-state.json    # State (auto-saved)
└── credentials/          # WhatsApp creds (warelay)

.env                      # Twitter API credentials
twitter-config.example.json  # Example config
```

## Shortcuts

```bash
# Alias for quick access
npm run ta tweet --text "Quick tweet!"
npm run ta dm --to user --message "Quick DM"
npm run ta relay --verbose
```

## Rate Limits (Free Tier)

- **Tweets**: ~50/day
- **DMs**: ~500/day  
- **API Reads**: ~500/15min per endpoint
- **Poll interval**: 60s recommended

## Safety Tips

- ✅ Always test with `--dry-run` first
- ✅ Use `allowedUsers` to restrict access
- ✅ Monitor API usage in Twitter Developer Portal
- ✅ Set reasonable poll intervals (60s+)
- ✅ Use timeouts on commands (30-60s)
- ⚠️ Be careful with `allowedUsers: ["*"]`
- ⚠️ Review Twitter's automation rules

## Documentation

- **Full docs**: [TWITTER-AGENT.md](TWITTER-AGENT.md)
- **Setup guide**: [GETTING-STARTED-TWITTER.md](GETTING-STARTED-TWITTER.md)
- **Config examples**: [docs/twitter-config.md](docs/twitter-config.md)
- **Implementation**: [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)

## Quick Test Flow

```bash
# 1. Test auth
npm run warelay-agent status

# 2. Test tweet (dry run)
npm run warelay-agent tweet --text "Test" --dry-run

# 3. Post real tweet
npm run warelay-agent tweet --text "Testing my agent! 🤖"

# 4. Start monitoring
npm run warelay-agent relay --verbose
```

---

**Ready to automate!** 🚀

For help: `npm run warelay-agent --help`
