# Sanjeevani v2 — Design System (Stitch)

## Design Philosophy
Premium ICU command center aesthetic. Combines clinical precision with modern glassmorphism. 
Dark mode mandatory for ICU environments (reduces eye strain in dim rooms).

## Color Tokens

### Primary Palette
- `--bg-deep`: `#050910` — Deepest background
- `--bg-base`: `#0a1122` — Base surface
- `--bg-surface`: `rgba(14, 24, 45, 0.75)` — Card surfaces
- `--bg-surface-hover`: `rgba(20, 33, 60, 0.85)` — Card hover
- `--bg-elevated`: `rgba(25, 40, 65, 0.6)` — Elevated elements
- `--bg-glass`: `rgba(14, 24, 45, 0.5)` — Glass elements

### Accent Colors
- `--accent-primary`: `#00d4aa` — Primary teal (clinical/safe)
- `--accent-secondary`: `#6366f1` — Indigo (scores/analytics)
- `--accent-cyan`: `#06b6d4` — Cyan (data/timeline)
- `--accent-violet`: `#8b5cf6` — Violet (AI provenance)

### Status Colors
- `--status-critical`: `#ff3b5c` — Critical alerts
- `--status-high`: `#ff8c42` — High severity
- `--status-moderate`: `#fbbf24` — Moderate warning
- `--status-safe`: `#10b981` — Safe/normal
- `--status-info`: `#3b82f6` — Information

### Text
- `--text-primary`: `#e8ecf4` — Primary text
- `--text-secondary`: `#8892a8` — Secondary text
- `--text-muted`: `#556078` — Muted text

## Typography
- **Font Stack**: `'Inter', system-ui, -apple-system, sans-serif`
- **Mono**: `'JetBrains Mono', 'Fira Code', monospace`
- **Heading**: weight 800, letter-spacing -0.02em
- **Body**: weight 400–500, line-height 1.6
- **Caption**: weight 500, letter-spacing 0.08em, uppercase

## Spacing Scale
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px
- `--space-2xl`: 48px

## Radius
- `--radius-sm`: 8px
- `--radius-md`: 12px
- `--radius-lg`: 16px
- `--radius-xl`: 24px
- `--radius-pill`: 999px

## Shadows & Glow
- `--shadow-sm`: `0 1px 3px rgba(0,0,0,0.5)`
- `--shadow-md`: `0 4px 24px rgba(0,0,0,0.4)`
- `--shadow-lg`: `0 12px 48px rgba(0,0,0,0.5)`
- `--glow-primary`: `0 0 30px rgba(0,212,170,0.15)`
- `--glow-critical`: `0 0 20px rgba(255,59,92,0.15)`
- `--glow-indigo`: `0 0 24px rgba(99,102,241,0.12)`

## Component Patterns

### Cards
- Background: `var(--bg-surface)`
- Border: `1px solid rgba(136,146,168,0.08)`
- Backdrop-filter: `blur(16px) saturate(1.3)`
- Border-radius: `var(--radius-lg)`
- Hover: border glow with accent color

### Badges
- Pill shape: `border-radius: var(--radius-pill)`
- Background: color at 12% opacity
- Border: color at 18% opacity
- Font: mono, uppercase, weight 700, 0.55rem

### Score Gauges
- Circular with ring animation
- Inner gradient background
- Outer glow based on severity
- Animated on mount

### Status Indicators
- Dot + label pattern
- Animated pulse for critical
- Color-coded backgrounds at 10% opacity
