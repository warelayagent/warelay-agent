# Getting Started with Warelay Agent (Twitter)

This guide will walk you through setting up and running your automated Twitter agent.

## Prerequisites

- Node.js 22+ installed
- Twitter Developer Account (free tier is fine)
- Claude CLI (optional, for AI auto-replies)

## Step 1: Get Twitter API Credentials

### Create Twitter Developer Account

1. Go to [https://developer.twitter.com](https://developer.twitter.com)
2. Sign in with your Twitter account
3. Apply for a developer account (free)
4. Answer the questions about your intended use

### Create a Twitter App

1. In the Developer Portal, go to "Projects & Apps"
2. Click "Create App"
3. Give it a name (e.g., "My Twitter Agent")
4. Save your API keys:
   - **API Key** (also called Consumer Key)
   - **API Secret** (also called Consumer Secret)

### Generate Access Tokens

1. In your app settings, go to "Keys and tokens"
2. Click "Generate" under "Access Token and Secret"
3. Save:
   - **Access Token**
   - **Access Secret**

### Set Permissions

1. In your app settings, go to "User authentication settings"
2. Set up OAuth 1.0a
3. Set permissions to **Read and Write** (or **Read, Write, and Direct Messages** if you want DM access)
4. Save changes

## Step 2: Setup Environment

### Install Dependencies

```bash
cd /Users/zach/Downloads/warelay-main
npm install twitter-api-v2
```

### Create .env File

Copy the Twitter credentials template:

```bash
cp .env.twitter.example .env
```

Edit `.env` and add your credentials:

```bash
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
```

## Step 3: Test the Agent

### Check Authentication

```bash
npm run warelay-agent status --verbose
```

You should see:
```
👤 Authenticated as:
  Name: Your Name
  Username: @yourhandle
  User ID: 123456789
```

### Post Your First Tweet

```bash
npm run warelay-agent tweet --text "Testing my new Twitter agent! 🤖"
```

### Send a Test DM

```bash
npm run warelay-agent dm --to your_friend --message "Hey, testing my agent!"
```

## Step 4: Setup Auto-Reply (Optional)

### Install Claude CLI

```bash
brew install anthropic-ai/cli/claude
claude login
```

### Create Config Directory

```bash
mkdir -p ~/.warelay
```

### Create Config File

Copy the example config:

```bash
cp twitter-config.example.json ~/.warelay/twitter.json
```

Edit `~/.warelay/twitter.json`:

```json
{
  "monitorDMs": true,
  "monitorMentions": true,
  "autoReplyDMs": true,
  "autoReplyMentions": false,
  "allowedUsers": ["your_friend", "another_friend"],
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

## Step 5: Run the Agent

### Start Monitoring

```bash
npm run warelay-agent relay --verbose
```

You should see:
```
🐦 Twitter relay started
  Monitor DMs: true
  Monitor mentions: true
  Poll interval: 60s
```

The agent is now:
- Checking for new DMs every 60 seconds
- Checking for new mentions every 60 seconds
- Auto-replying using Claude (if configured)

### Test Auto-Reply

1. Send a DM to your bot account from another account
2. Watch the logs - you should see:
   ```
   📨 Found 1 new DM(s)
     DM from 123456789: Hello bot!
     🤖 Running: claude ...
     ✅ Replied to DM from 123456789
   ```

## Step 6: Deploy (Production)

### Option A: Run in Background with PM2

```bash
# Install PM2
npm install -g pm2

# Start agent
pm2 start npm --name "twitter-agent" -- run twitter-agent relay --verbose

# View logs
pm2 logs twitter-agent

# Restart
pm2 restart twitter-agent

# Stop
pm2 stop twitter-agent
```

### Option B: Run as systemd Service (Linux)

Create `/etc/systemd/system/twitter-agent.service`:

```ini
[Unit]
Description=Twitter Agent
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/warelay-main
Environment="NODE_ENV=production"
EnvironmentFile=/path/to/.env
ExecStart=/usr/bin/npm run warelay-agent relay
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

### Option C: Run with tmux (Simple)

```bash
# Start tmux session
tmux new -s twitter-agent

# Run agent
npm run warelay-agent relay --verbose

# Detach: Ctrl+B, then D
# Reattach: tmux attach -t twitter-agent
```

## Common Use Cases

### 1. Personal Assistant

Monitor your DMs, respond to questions:

```json
{
  "monitorDMs": true,
  "autoReplyDMs": true,
  "allowedUsers": ["*"],
  "autoReply": {
    "mode": "command",
    "command": ["claude"],
    "bodyPrefix": "You are my personal assistant. Help with scheduling, questions, and reminders.\n\n"
  }
}
```

### 2. Customer Support

Auto-respond to mentions:

```json
{
  "monitorMentions": true,
  "autoReplyMentions": true,
  "autoReply": {
    "mode": "command",
    "command": ["claude"],
    "bodyPrefix": "You are a customer support agent for [Your Company]. Be helpful and professional.\n\n"
  }
}
```

### 3. Content Monitor

Track mentions without auto-replying:

```json
{
  "monitorMentions": true,
  "autoReplyMentions": false
}
```

Just monitor and save logs to review later.

### 4. Scheduled Tweets

Create a cron job to post tweets:

```bash
# Edit crontab
crontab -e

# Add line to tweet every day at 9am
0 9 * * * cd /path/to/warelay-main && npm run warelay-agent tweet --text "Good morning! 🌅"
```

## Troubleshooting

### "Missing Twitter credentials"

Make sure `.env` file exists and has all four credentials:
```bash
cat .env | grep TWITTER
```

### "Rate limit exceeded"

You hit Twitter's rate limits. Solutions:
- Increase poll interval: `--interval 120`
- Reduce activity
- Wait for rate limit to reset (15 minutes)
- Upgrade to higher API tier

### "User not found"

When sending DMs, make sure:
- Username is correct (without @)
- User allows DMs from you
- You're authenticated properly

### "Permission denied"

Your app doesn't have the right permissions:
1. Go to Twitter Developer Portal
2. App Settings → User authentication settings
3. Set permissions to "Read and Write and Direct Messages"
4. Regenerate access tokens

### Claude command fails

Make sure Claude CLI is installed and authenticated:
```bash
claude --version
claude login
```

## Next Steps

- Read [TWITTER-AGENT.md](TWITTER-AGENT.md) for complete documentation
- Check [docs/twitter-config.md](docs/twitter-config.md) for config examples
- Customize your auto-reply behavior
- Add user filtering
- Set up rate limiting
- Deploy to production

## Need Help?

- Check the [warelay documentation](README.md)
- Review Twitter API docs: https://developer.twitter.com/en/docs
- Test with `--dry-run` flag before posting
- Use `--verbose` to see detailed logs

Happy automating! 🤖✨
