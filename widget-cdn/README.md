# ChatIQ Widget CDN

Modern, minimal, and premium embeddable chat widget with light/dark theme support.

## ✨ Features

- 🎨 **Design Tokens** - Semantic color system that adapts to light & dark themes
- ✨ **Smooth Animations** - Delightful transitions and micro-interactions  
- 📱 **Fully Responsive** - Perfect on desktop, tablet, and mobile
- ♿ **Accessible** - WCAG AA compliant with ARIA labels and keyboard navigation
- 💬 **Typing Indicator** - Shows when support team is typing
- 🔒 **Shadow DOM** - Isolated styles won't conflict with your site
- 🎯 **Auto-resize Textarea** - Composer grows with message content
- 🌓 **Theme Support** - Automatic light/dark mode detection

## 🚀 Quick Start

### Local Development

```bash
npm run dev
```

Then open http://localhost:3000 to see the demo page.

### Deploy to Vercel

```bash
vercel --prod
```

## 📦 Usage

Add this script tag to any website:

```html
<script
  src="https://your-cdn.vercel.app/widget.js"
  data-site-id="YOUR_SITE_ID">
</script>
```

## 🎨 Design System

### Color Tokens

The widget uses semantic design tokens that automatically adapt to light/dark themes:

**Light Theme:**
- `--primary`: #2563EB (Blue 600)
- `--background`: #FFFFFF
- `--surface`: #F9FAFB
- `--foreground`: #111827

**Dark Theme:**
- `--primary`: #3B82F6 (Blue 500)
- `--background`: #0F172A (Slate 900)
- `--surface`: #020617 (Slate 950)
- `--foreground`: #E5E7EB

### Typography

- **Font Family**: System UI stack
- **Font Sizes**: 14px (body), 12px (caption)
- **Line Height**: 1.4
- **Weights**: 600 (titles), 400 (body)

### Spacing Scale

- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 12px
- `--spacing-lg`: 16px
- `--spacing-xl`: 20px
- `--spacing-2xl`: 24px

## 🛠️ JavaScript API

The widget exposes a global `ChatIQ` object for programmatic control:

```javascript
// Open the chat widget
ChatIQ.open()

// Close the chat widget
ChatIQ.close()

// Send a message programmatically
ChatIQ.sendMessage('Hello!')

// Toggle theme (light/dark)
ChatIQ.toggleTheme()

// Show notification badge
ChatIQ.showBadge()

// Hide notification badge
ChatIQ.hideBadge()

// Access widget info
ChatIQ.version      // Widget version
ChatIQ.siteId       // Current site ID
ChatIQ.visitorId    // Unique visitor identifier
```

## 📁 Structure

```
widget-cdn/
├── public/
│   ├── widget.js      # Main widget script (v2.0.0)
│   └── index.html     # Premium demo page
├── vercel.json        # Vercel config with CORS headers
├── package.json
└── README.md
```

## 🎯 Configuration

The widget reads configuration from the script tag attributes:

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-site-id` | Yes | Your unique site identifier |

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## ♿ Accessibility

- **WCAG AA** contrast ratios
- **ARIA** roles and labels
- **Keyboard navigation** support
- **Focus indicators** on all interactive elements
- **Screen reader** friendly

## 🎨 UI Components

### Launcher Button
- Floating action button (bottom-right)
- 56px × 56px (desktop), 48px × 48px (mobile)
- Smooth hover and click animations
- Optional notification badge

### Chat Panel
- 380px × 520px (desktop)
- Full viewport (mobile)
- Three sections: Header, Conversation, Composer
- Smooth slide-up animation on open

### Messages
- Assistant messages: left-aligned with avatar
- User messages: right-aligned, no avatar
- Max width: 75% of conversation area
- Rounded corners with asymmetric radius

### Typing Indicator
- Three animated dots
- Pulse animation (1.4s cycle)
- Shows in assistant message position

### Composer
- Auto-resizing textarea (max 4 rows / 120px)
- Disabled send button when empty
- Enter to send, Shift+Enter for new line

## 📋 TODO

- [ ] WebSocket integration with API server
- [ ] Message persistence
- [ ] File attachments
- [ ] Emoji picker
- [ ] Customizable themes via config
- [ ] Multi-language support
- [ ] Message read receipts

## 📄 License

MIT
# widget-cdn
