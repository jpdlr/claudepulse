# ClaudePulse

A macOS menu bar app for monitoring Claude Code usage at a glance.

ClaudePulse reads your local Claude Code session data and displays real-time usage statistics in a compact popover — including 5-hour rolling window usage, weekly totals, model breakdown, and estimated costs.

## Features

- **Menu bar icon** — lives in your macOS toolbar, click to toggle the popover
- **5-hour rolling window** — matches Claude Code's rate limit window with token counts (input, output, cache)
- **Weekly usage** — aggregated view with a daily bar chart
- **Model breakdown** — visual split between Sonnet, Opus, and Haiku usage
- **Cost estimates** — estimated USD for both the current window and the week
- **Live updates** — auto-refreshes on a configurable interval and watches for new session data
- **Light & dark themes** — follows your system preference or set manually
- **Configurable token limit** — set a budget to see a progress meter on the 5-hour window

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Rust](https://rustup.rs/) (stable)
- macOS 13+

### Development

```bash
# Install dependencies
npm install

# Start in dev mode (opens menu bar app with hot-reload)
npm run tauri dev
```

### Build

```bash
# Build the .app and .dmg
npm run tauri build
```

The built app will be at `src-tauri/target/release/bundle/macos/ClaudePulse.app`.

## How It Works

ClaudePulse reads Claude Code's local session JSONL files from `~/.claude/projects/`. Each session file contains usage entries with token counts per API response. The Rust backend parses these files, deduplicates entries, and aggregates usage by time window and model. The React frontend renders the data in a compact popover anchored to the menu bar icon.

## Configuration

Click the gear icon in the popover to configure:

| Setting | Default | Description |
|---------|---------|-------------|
| Refresh interval | 3 min | How often to re-read usage data |
| Window duration | 5 hours | Rolling window size (matches Claude's rate limit) |
| Token limit | None | Set a budget to show a progress meter |
| Theme | System | Light, dark, or follow system preference |

Settings are persisted to `~/.claude/claudepulse-settings.json`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build frontend for production |
| `npm test` | Run frontend tests (Vitest) |
| `npm run typecheck` | TypeScript type checking |
| `npm run tauri dev` | Full dev mode with Tauri |
| `npm run tauri build` | Production build (.app + .dmg) |

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Rust via Tauri v2
- **Styling:** CSS Modules with MD3-inspired design tokens
- **Testing:** Vitest + React Testing Library (frontend), `cargo test` (Rust)

## Project Structure

```
claudepulse/
├── src/                      # React frontend
│   ├── components/           # UI components (cards, meters, settings)
│   ├── hooks/                # React hooks (data fetching, theme, settings)
│   ├── lib/                  # Utilities (formatting)
│   ├── styles/               # Theme tokens + global styles
│   └── types/                # TypeScript interfaces
├── src-tauri/                # Rust backend
│   └── src/
│       ├── lib.rs            # Tauri setup + tray + popover
│       ├── parser.rs         # JSONL file parser
│       ├── aggregator.rs     # Usage aggregation + cost calculation
│       ├── commands.rs       # Tauri commands (JS ↔ Rust bridge)
│       ├── watcher.rs        # File system watcher
│       └── settings.rs       # Settings persistence
├── tests/                    # Frontend tests
└── .github/workflows/        # CI pipeline
```

## License

MIT
