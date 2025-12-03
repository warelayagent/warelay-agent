# Twitter Agent Configuration Examples

## Environment Variables (.env)

```bash
# Twitter API Credentials (get from https://developer.twitter.com)
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
TWITTER_BEARER_TOKEN=optional_bearer_token_here
```

## Twitter Config (~/.warelay/twitter.json)

### Basic Monitoring (No Auto-Reply)

```json
{
  "monitorDMs": true,
  "monitorMentions": true,
  "allowedUsers": ["user1", "user2"],
  "blockedUsers": ["spammer1"],
  "maxTweetsPerHour": 50,
  "maxDMsPerHour": 100
}
```

### Static Auto-Reply

```json
{
  "monitorDMs": true,
  "monitorMentions": true,
  "autoReplyDMs": true,
  "autoReplyMentions": true,
  "allowedUsers": ["*"],
  "autoReply": {
    "mode": "static",
    "text": "Thanks for reaching out! I'll get back to you soon."
  }
}
```

### Claude-Powered Auto-Reply

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
    "bodyPrefix": "You are a helpful Twitter assistant. Keep responses under 280 characters and friendly.\n\n",
    "timeoutSeconds": 30,
    "session": {
      "scope": "per-user",
      "resetTriggers": ["/new", "/reset"],
      "idleMinutes": 60
    }
  }
}
```

### Advanced: DMs Only, Specific Users

```json
{
  "monitorDMs": true,
  "monitorMentions": false,
  "autoReplyDMs": true,
  "allowedUsers": ["friend1", "friend2", "colleague"],
  "maxDMsPerHour": 50,
  "autoReply": {
    "mode": "command",
    "command": ["claude"],
    "bodyPrefix": "You are my personal AI assistant on Twitter. Be concise and helpful.\n\n",
    "timeoutSeconds": 45,
    "session": {
      "scope": "per-user",
      "resetTriggers": ["/new"],
      "idleMinutes": 120
    }
  }
}
```

### OpenAI GPT Auto-Reply

```json
{
  "monitorDMs": true,
  "monitorMentions": true,
  "autoReplyDMs": true,
  "autoReplyMentions": true,
  "autoReply": {
    "mode": "command",
    "command": ["openai", "chat", "completions", "create", "--model", "gpt-4"],
    "bodyPrefix": "You are a Twitter bot. Keep responses under 280 characters.\n\n",
    "timeoutSeconds": 30
  }
}
```

## Session Management

The `session` object controls conversation memory:

- **`scope`**: `"per-user"` (separate session per user) or `"global"` (one shared session)
- **`resetTriggers`**: Array of keywords that reset the conversation (e.g., `["/new", "/reset"]`)
- **`idleMinutes`**: How long before a session expires from inactivity

## Rate Limiting

- **`maxTweetsPerHour`**: Maximum tweets to post per hour (default: 50)
- **`maxDMsPerHour`**: Maximum DMs to send per hour (default: 100)

## User Filtering

- **`allowedUsers`**: Array of usernames allowed to trigger auto-reply. Use `["*"]` for all users.
- **`blockedUsers`**: Array of usernames to ignore (takes precedence over allowedUsers)

## Command Mode

When `mode: "command"`, the agent runs an external command (like `claude`) with the message text:

1. Input is preprocessed with `bodyPrefix` if provided
2. Command is executed with timeout
3. Response is sent back to the user
4. Sessions are managed automatically if configured

The command should:
- Accept input as the last argument
- Return the response to stdout
- Exit with code 0 on success
