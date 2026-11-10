# Design Brief

## Direction

Neon Grimoire — a dark RPG-academy interface where studying feels like leveling a character in a violet-lit arcane library.

## Tone

Futuristic premium with restrained maximalism: deep indigo-violet darkness, glass panels, and one confident gradient accent — never garish.

## Differentiation

Every surface reads as a translucent glass plate floating over a violet nebula, with gradient XP bars and monospace stat readouts that make progress feel like a game HUD.

## Color Palette

| Token      | OKLCH          | Role                                    |
| ---------- | -------------- | --------------------------------------- |
| background | 0.13 0.028 288 | Deep indigo-black app canvas (dark)     |
| foreground | 0.95 0.01 285  | Primary text, near-white lavender       |
| card       | 0.18 0.032 288 | Glass card base, one step above canvas  |
| primary    | 0.62 0.24 300  | Vivid violet — CTAs, active nav, XP     |
| accent     | 0.6 0.2 265    | Electric indigo — secondary highlights  |
| muted      | 0.24 0.035 288 | Inactive surfaces, quest rows, inputs   |

Light mode inverts L (background 0.98, foreground 0.16) keeping hue 285–300 stable.

## Typography

- Display: Space Grotesk — hero, section headings, level titles (tight tracking, bold)
- Body: DM Sans — paragraphs, labels, nav items
- Mono: JetBrains Mono — XP counters, timers, stat numbers, leaderboard ranks
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Layered translucency: canvas → glass card (`glass` + `shadow-glass`) → popover, with soft violet-tinted shadows and 1px violet borders instead of heavy drop shadows.

## Structural Zones

| Zone    | Background           | Border                | Notes                                    |
| ------- | -------------------- | --------------------- | ---------------------------------------- |
| Header  | `bg-card/70` glass   | `border-b`            | Sticky; blurred; holds XP + theme toggle |
| Sidebar | `bg-sidebar` glass   | `border-r`            | Desktop `lg:` only; active item gradient |
| Content | `bg-background`      | —                     | Alternate sections with `bg-muted/30`    |
| Footer  | `bg-muted/40`        | `border-t`            | Landing page footer only                 |
| Mobile  | `bg-card/80` glass   | `border-t`            | Bottom tab bar, `lg:hidden`              |

## Spacing & Rhythm

Sections gap `py-12 md:py-20`; card grids `gap-4 md:gap-6`; micro-spacing `gap-2`/`p-4`; generous negative space around hero, denser inside stat cards.

## Component Patterns

- Buttons: primary = gradient fill `bg-gradient-primary` with `rounded-xl`, hover glow + slight lift; ghost = transparent with `border-border`
- Cards: `rounded-2xl glass shadow-glass`, hover raises border opacity and adds `-translate-y-0.5`
- Badges: pill `rounded-full`, success green for completed, warning amber for in-progress, primary violet for XP/level

## Motion

- Entrance: `animate-fade-up` staggered 60ms per card, 0.5s cubic-bezier(0.4,0,0.2,1)
- Hover: `transition-smooth` scale/lift + border brighten, 0.3s
- Decorative: `animate-float` on hero orbs, `animate-pulse-glow` on level badge and streak flame

## Constraints

- Never use raw hex/rgb or arbitrary `bg-[#...]` — semantic tokens only
- One gradient accent family (violet→indigo→blue); no rainbow palettes
- Glassmorphism must keep AA+ text contrast in both modes; no glow-only shadows
- Mobile-first: sidebar is `lg:` only, bottom nav carries primary navigation below `lg`

## Signature Detail

The gradient XP progress bar with a glowing level badge and monospace counter — the game-HUD moment that recurs across dashboard, quests, and leaderboards.
