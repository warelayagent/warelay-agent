const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from website directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve terminal.html for /terminal.html
app.get('/terminal.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'terminal.html'));
});

// Export for Vercel
module.exports = app;

// Only listen if running locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌐 Warelay Agent website running at http://localhost:${PORT}`);
    console.log(`📱 Open in browser to view`);
  });
}
