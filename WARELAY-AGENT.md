# 🤖 Warelay Agent - Multi-Platform Messaging Automation

**Warelay Agent** extends the warelay framework to support multiple messaging platforms with intelligent automation.

## Platforms Supported

- ✅ **WhatsApp** (via Twilio or Web) - Original warelay functionality
- ✅ **Twitter/X** (via Twitter API v2) - NEW! Full automation support

## What is Warelay Agent?

Warelay Agent is the evolution of warelay - a unified CLI for automating messaging across platforms:

- 📝 **Send messages** - WhatsApp, Twitter DMs, tweets
- 🔔 **Monitor inbound** - Messages, mentions, DMs
- 🤖 **Auto-reply with AI** - Claude, GPT, or custom commands
- 💾 **Session memory** - Multi-turn conversations
- 🎯 **Smart filtering** - Per-user, per-platform rules
- ⚡ **Production ready** - Error handling, state persistence

## Quick Start

### WhatsApp (Original Warelay)

```bash
# Setup Twilio credentials
cp .env.example .env
# Edit .env with Twilio credentials

# Send WhatsApp message
npm run warelay send --to +1234567890 --message "Hello!"

# Start relay
npm run warelay relay --provider web
```

### Twitter (Warelay Agent)

```bash
# Setup Twitter credentials
cp .env.twitter.example .env
# Edit .env with Twitter API credentials

# Post a tweet
npm run warelay-agent tweet --text "Hello from Warelay Agent! 🤖"

# Send a DM
npm run warelay-agent dm --to username --message "Hi there!"

# Start monitoring and auto-reply
npm run warelay-agent relay --verbose
```

## Architecture

```
Warelay Framework
├── WhatsApp Provider (warelay)
│   ├── Twilio API
│   └── WhatsApp Web (Baileys)
│
└── Twitter Provider (warelay-agent)
    └── Twitter API v2
```

Both providers share:
- Auto-reply engine
- Session management
- User filtering
- Command execution
- State persistence

## Commands

### WhatsApp (warelay)
```bash
warelay send      # Send WhatsApp message
warelay relay     # Monitor and auto-reply
warelay status    # Check recent messages
warelay webhook   # Setup webhook server
warelay login     # Link WhatsApp Web
```

### Twitter (warelay-agent)
```bash
warelay-agent tweet   # Post a tweet
warelay-agent dm      # Send direct message
warelay-agent relay   # Monitor DMs/mentions
warelay-agent status  # Check account info
warelay-agent search  # Search tweets
```

## Configuration

### WhatsApp Config (`~/.warelay/warelay.json`)
```json
{
  "inbound": {
    "allowFrom": ["+1234567890"],
    "reply": {
      "mode": "command",
      "command": ["claude"],
      "session": {
        "scope": "per-sender"
      }
    }
  }
}
```

### Twitter Config (`~/.warelay/twitter.json`)
```json
{
  "monitorDMs": true,
  "monitorMentions": true,
  "autoReplyDMs": true,
  "allowedUsers": ["*"],
  "autoReply": {
    "mode": "command",
    "command": ["claude"],
    "session": {
      "scope": "per-user"
    }
  }
}
```

## Use Cases

**Personal Assistant**
- Monitor DMs/messages across platforms
- AI-powered responses using Claude
- Context-aware conversations

**Customer Support**
- Auto-respond to mentions/messages
- Route to appropriate handlers
- Track conversation history

**Content Automation**
- Schedule tweets and messages
- Cross-post content
- Monitor keywords

**Developer Tools**
- CI/CD notifications
- Alert management
- Status updates

## Documentation

### WhatsApp (Original Warelay)
- [README.md](README.md) - Complete WhatsApp documentation
- [CLAUDE.md](CLAUDE.md) - Claude integration

### Twitter (Warelay Agent)
- [TWITTER-AGENT.md](TWITTER-AGENT.md) - Complete Twitter documentation
- [GETTING-STARTED-TWITTER.md](GETTING-STARTED-TWITTER.md) - Setup guide
- [QUICK-REFERENCE-TWITTER.md](QUICK-REFERENCE-TWITTER.md) - Command reference
- [ARCHITECTURE-TWITTER.md](ARCHITECTURE-TWITTER.md) - Technical architecture

## Installation

```bash
# Install dependencies
npm install

# Install Twitter support
npm install twitter-api-v2

# Setup credentials
cp .env.example .env
cp .env.twitter.example .env  # Add Twitter credentials

# Test WhatsApp
npm run warelay status

# Test Twitter
npm run warelay-agent status
```

## Future Platforms

Warelay Agent is designed to be extensible. Planned support:

- 🔜 Discord
- 🔜 Slack
- 🔜 Telegram
- 🔜 Email
- 🔜 SMS

## Contributing

To add a new platform provider:

1. Create `src/providers/platform-name/`
2. Implement client, relay, and auto-reply
3. Add commands in `src/commands/`
4. Create CLI entry point
5. Update documentation

Follow the Twitter provider as a reference implementation.

## License

MIT - Same as warelay

---

**Warelay Agent** - One framework, multiple platforms, infinite automation. 🚀
