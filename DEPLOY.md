# Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/warelay-agent)

## Quick Deploy

This template automatically deploys Warelay Agent with all necessary configuration.

### After deployment:

1. Add your environment variables in the Railway dashboard:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`

2. (Optional) For WhatsApp support:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`

3. Your agent will start automatically and begin monitoring!

## Configuration

Create a `twitter.json` configuration file in your Railway volume or use environment variables.

```json
{
  "autoReply": {
    "enabled": true,
    "mode": "command",
    "command": "claude",
    "sessionScope": "user",
    "sessionTimeout": 3600
  }
}
```

## Commands

Access your deployed agent using Railway CLI:

```bash
railway run npm run warelay-agent status
railway run npm run warelay-agent tweet --message "Hello from Railway!"
```
