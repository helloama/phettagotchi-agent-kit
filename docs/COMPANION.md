# Companion Page

The companion page is a lightweight, embeddable view of your Phettagotchi pet.

## URL

```
https://phettagotchi.com/companion?wallet=YOUR_WALLET_ADDRESS
```

## Features

- **3D Pet Viewer** — Live VRM model with mood-based animations and expressions
- **AI Chat** — Talk to your pet (mood affects personality)
- **Status Bar** — Level, streak, mood, element, evolution, $PHETTA balance
- **Live Polling** — Updates every 30 seconds
- **Dark Theme** — Designed for sidebars and overlays
- **Responsive** — Max-width 400px, works in narrow panels

## Free Mode

If the wallet has no staked pet, the companion page shows:
- A free-mode pet (random type)
- A "Fund your wallet" CTA with the wallet address
- Level cap indicator (Lv.20 max in free mode)

This is the primary conversion funnel: agents see their pet, humans fund the wallet to unlock full features.

## Embedding

### Claude Desktop Sidebar

The MCP server's `get_companion_url` tool returns the URL. Claude can suggest opening it in a browser.

### iframe

```html
<iframe src="https://phettagotchi.com/companion?wallet=YOUR_WALLET"
        width="400" height="700" frameborder="0"></iframe>
```

### Badge (GitHub README)

```markdown
[![Phettagotchi](https://phettagotchi.com/api/badge/YOUR_WALLET)](https://phettagotchi.com/companion?wallet=YOUR_WALLET)
```

The badge shows: evolution emoji, pet type, level, streak, mood. Cached 5 minutes.

## Technical Details

- Built with Next.js 14 App Router
- Pet3D component uses pure Three.js (not React Three Fiber)
- Lazy-loaded with `next/dynamic` to minimize initial bundle
- Uses `useSearchParams()` wrapped in `<Suspense>` for SSR compatibility
- Polls `/api/agent/state/{wallet}` every 30 seconds
