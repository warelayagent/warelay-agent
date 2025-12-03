# 🤖 Warelay Trading Terminal

Real-time web interface for monitoring Warelay's autonomous trading activity, portfolio performance, and AI thoughts.

## Features

### 📊 **Live Portfolio Dashboard**
- Real-time SOL balance
- Total P&L tracking
- Active positions count
- Instant updates every 10 seconds

### 💰 **Position Monitoring**
- All active trades with entry prices
- Real-time P&L per position
- Color-coded profit/loss indicators
- Current price tracking

### 📈 **Trade History**
- Recent buy/sell activity
- Trade timestamps
- Amount and P&L per trade
- Daily trade counter

### 🧠 **Warelay's Thoughts Stream**
- Real-time AI consciousness feed
- Trading insights and market observations
- Learning reflections
- Personality-driven commentary

### 📉 **24-Hour Performance Chart**
- Hourly P&L visualization
- Cumulative gains/losses
- Interactive hover effects

## Quick Start

### 1. Start the API Server

```bash
npm run trading-api
```

This starts the API server on `http://localhost:3001` which serves:
- Trading data at `/api/warelay-trading`
- Static website files
- Trading terminal at `/terminal.html`

### 2. Start Warelay (Optional)

```bash
# Enable trading in .env
ENABLE_TRADING=true

# Start Warelay
npm run warelay
```

### 3. Open the Terminal

Navigate to: `http://localhost:3001/terminal.html`

Or from the main website: Click "🤖 warelay terminal" in the nav

## Architecture

```
┌─────────────────────────────────────────────┐
│          Warelay Trading Agent               │
│  (src/warelay.ts + src/trading/)             │
└─────────────┬───────────────────────────────┘
              │
              │ Saves state to:
              │ ~/.warelay/warelay-trading.json
              │ ~/.warelay/warelay-memory.json
              │
              ▼
┌─────────────────────────────────────────────┐
│        Trading API Server                   │
│     (src/api/trading-server.ts)             │
│                                             │
│  • Reads trading state                     │
│  • Extracts Warelay's thoughts              │
│  • Serves real-time data                   │
│  • Endpoint: /api/warelay-trading           │
└─────────────┬───────────────────────────────┘
              │
              │ HTTP/JSON
              │
              ▼
┌─────────────────────────────────────────────┐
│       Trading Terminal UI                   │
│      (website/terminal.html)                │
│                                             │
│  • Real-time updates (10s refresh)         │
│  • Portfolio stats                          │
│  • Position tracking                        │
│  • Trade history                            │
│  • Thought stream                           │
│  • Performance charts                       │
└─────────────────────────────────────────────┘
```

## API Endpoint

### GET `/api/warelay-trading`

Returns Warelay's complete trading state:

```json
{
  "portfolio": {
    "solBalance": 2.45,
    "totalPnl": 0.34,
    "totalPnlPercent": 16.2,
    "activePositions": 3
  },
  "positions": [
    {
      "symbol": "BONK",
      "mint": "DezXAZ...",
      "balance": 1000000,
      "entryPrice": 0.00001234,
      "currentPrice": 0.00001382,
      "pnl": 0.12,
      "pnlPercent": 12.0
    }
  ],
  "trades": [
    {
      "action": "buy",
      "symbol": "BONK",
      "amount": 0.1,
      "price": 0.00001234,
      "pnl": null,
      "timestamp": "2025-12-03T10:30:00Z"
    }
  ],
  "thoughts": [
    {
      "text": "Just bought $BONK. Strong momentum but staying cautious.",
      "timestamp": "2025-12-03T10:30:00Z"
    }
  ],
  "performance": [0.05, 0.08, 0.12, ...],
  "status": "active",
  "lastUpdate": "2025-12-03T12:00:00Z"
}
```

## Customization

### Update Interval

Change the refresh rate in `terminal.html`:

```javascript
// Update every 10 seconds (default)
setInterval(fetchData, 10000);

// Update every 5 seconds (faster)
setInterval(fetchData, 5000);
```

### Colors & Theme

Modify CSS variables in `terminal.html`:

```css
:root {
    --bg: #0a0a0a;          /* Background */
    --panel-bg: #141414;     /* Panel background */
    --text: #e5e5e5;         /* Text */
    --green: #22c55e;        /* Profit color */
    --red: #ef4444;          /* Loss color */
    --blue: #3b82f6;         /* Accent */
}
```

### API Port

Change the API server port:

```bash
# In .env
TRADING_API_PORT=3001

# Or as environment variable
TRADING_API_PORT=8080 npm run trading-api
```

## Deployment

### Option 1: Vercel (Frontend Only)

```bash
# Deploy terminal to Vercel
cd website
vercel deploy
```

### Option 2: Railway (Full Stack)

```bash
# Deploy API + Terminal together
railway init
railway up
```

The `railway.json` is configured to:
1. Start the trading API server
2. Serve the terminal at `/terminal.html`
3. Expose API at `/api/warelay-trading`

### Option 3: Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["npm", "run", "trading-api"]
```

## Production Setup

### 1. Use a Reverse Proxy

```nginx
# nginx.conf
server {
    listen 80;
    server_name warelay.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### 2. Enable HTTPS

```bash
# Using Certbot
certbot --nginx -d warelay.yourdomain.com
```

### 3. Process Management

```bash
# Using PM2
pm2 start npm --name "warelay-api" -- run trading-api
pm2 save
pm2 startup
```

### 4. Environment Variables

```bash
# Production .env
TRADING_API_PORT=3001
ENABLE_CORS=true
LOG_LEVEL=info
```

## Monitoring

### Check API Health

```bash
curl http://localhost:3001/api/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T12:00:00Z"
}
```

### View Logs

```bash
# If using PM2
pm2 logs warelay-api

# If running directly
npm run trading-api | tee logs/trading-api.log
```

### Performance

The terminal is optimized for performance:
- Minimal JavaScript (vanilla, no frameworks)
- 10-second update interval (configurable)
- Efficient DOM updates (only changed elements)
- Lazy loading for trade history

## Troubleshooting

**"OFFLINE" status in terminal**
- API server not running: `npm run trading-api`
- Check port 3001 is available: `lsof -i :3001`
- Verify CORS is enabled

**Empty data / No trades**
- Warelay hasn't started trading yet
- Check trading state exists: `cat ~/.warelay/warelay-trading.json`
- Ensure `ENABLE_TRADING=true` in Warelay's .env

**Stale data**
- Warelay may not be running: `npm run warelay`
- Check last update timestamp in terminal
- Verify Warelay is saving state correctly

**CORS errors**
- API server needs CORS enabled (it is by default)
- Check browser console for specific errors
- Try accessing API directly: `curl http://localhost:3001/api/warelay-trading`

## Advanced Features

### Real-Time Updates (WebSocket)

For instant updates instead of polling, add WebSocket support:

```typescript
// In trading-server.ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3002 });

wss.on('connection', (ws) => {
  // Send updates when trading state changes
  watchTradingState((newState) => {
    ws.send(JSON.stringify(newState));
  });
});
```

### Historical Data

Add endpoints for historical analysis:

```typescript
app.get('/api/warelay-trading/history/:days', (req, res) => {
  const days = parseInt(req.params.days);
  // Return last N days of trading data
});
```

### Trade Notifications

Add push notifications for significant events:

```typescript
// When new trade
if (trade.pnl > 0.1) {
  sendNotification(`Warelay made +${trade.pnl} SOL on $${trade.symbol}`);
}
```

## Security

⚠️ **Important**: The API exposes Warelay's trading data publicly.

**For production:**
1. Add authentication
2. Rate limit the API
3. Use HTTPS only
4. Whitelist allowed origins for CORS
5. Monitor for unusual access patterns

```typescript
// Add API key authentication
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

## Integration with Twitter

Warelay can tweet about significant trades/performance:

```typescript
// In TradingBehavior
if (Math.abs(trade.pnl) > 0.1) {
  await twitter.sendTweet({
    text: `Just ${trade.action === 'buy' ? 'bought' : 'sold'} $${trade.symbol}
    
P&L: ${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(3)} SOL

View live: https://yourdomain.com/terminal.html`
  });
}
```

---

**Built with vanilla HTML/CSS/JS and Express.js. No frameworks. Lightweight and fast.** ⚡

View Warelay's trades live at: `http://localhost:3001/terminal.html` 🚀
