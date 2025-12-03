# Warelay Agent Website

A modern, responsive landing page for Warelay Agent.

## Features

- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, professional design with smooth animations
- 📝 **Documentation** - Code examples and quick start guide
- 🚀 **Fast** - Static HTML, CSS, and vanilla JavaScript
- 🎯 **SEO Ready** - Proper meta tags and semantic HTML

## Quick Start

### Option 1: Run from main project

```bash
# From the root directory
npm run website
```

### Option 2: Run directly

```bash
cd website
npm install
npm start
```

The website will be available at `http://localhost:3000`

### Option 3: Open directly

Just open `index.html` in your browser - no server needed!

## Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Follow prompts

### Deploy to Netlify

1. Drag and drop the `website` folder to Netlify
2. Or connect your GitHub repo

### Deploy to GitHub Pages

1. Push to GitHub
2. Go to Settings → Pages
3. Select branch and `/website` folder
4. Your site will be at `https://username.github.io/warelay/`

### Deploy to any static host

Just upload the contents of the `website` folder to any static hosting:
- AWS S3
- Cloudflare Pages
- Firebase Hosting
- etc.

## Customization

### Colors

Edit the CSS variables in `index.html`:

```css
:root {
    --primary: #6366f1;      /* Main brand color */
    --secondary: #10b981;     /* Accent color */
    --dark: #1e293b;          /* Text color */
    --light: #f8fafc;         /* Background */
}
```

### Content

All content is in `index.html`. The structure is:
- Header/Navigation
- Hero section
- Features section
- Platforms section
- Code examples
- CTA section
- Footer

### Add new sections

```html
<section class="your-section">
    <div class="container">
        <h2 class="section-title">Your Title</h2>
        <!-- Your content -->
    </div>
</section>
```

## Structure

```
website/
├── index.html       # Main landing page
├── server.js        # Express server (optional)
├── package.json     # Dependencies
└── README.md        # This file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT - Same as Warelay
