# Project Guidance

## User Preferences

- Dark background with deep purple and black, violet, indigo and blue gradient accents
- Glassmorphism cards with smooth animations and transitions
- Modern typography and beautiful icons
- Responsive mobile-first design with a desktop sidebar and mobile navigation
- Light and dark mode
- Premium education platform feel combined with an RPG gaming progression system

## Accepted Requirements

- Futuristic premium dark UI with purple/black background, violet-indigo-blue gradients, glassmorphism cards, smooth animations, modern typography, icons, mobile-first responsive design, desktop sidebar and mobile navigation, and light/dark mode
- Sign up, login, logout, forgot password, user profile and secure persistent per-student data
- Student dashboard with welcome message, XP, level, daily goal, study time today, weekly statistics, streak, daily quests, recent achievements, XP progress bar and quick access to study materials
- Study room with customizable timer, daily goal in hours, start/pause/finish, subject selection, session history, daily and weekly reports, streak tracking, XP for verified sessions (30 min = 20 XP, 60 min = 50 XP) and server-side anti-cheat validation
- Auto-refreshing daily quests with title, description, XP reward, progress bar, completion status and claim button; admin can create, edit and delete quests
- XP store with item descriptions, XP prices, purchase confirmation, owned items and purchase history; no negative balances or duplicate purchases
- Three membership plans (MODERATE ₹20 2X, ADVANCED ₹50 3X, ULTIMATE ₹99) with pricing cards, membership status, expiry dates and payment verification that never activates benefits on click alone
- Anime theme store with Default Purple, Neon Cyberpunk, Anime Dark, Shadow Monarch, Violet Galaxy, Minimal Black and Custom Gradient; Ultimate-only premium themes; instant preview and apply
- Searchable study library with the listed categories, search, filters, PDF viewer and download using legally available resources
- WEBSITE HUB with educational site shortcuts opening in a new tab; admin can add and remove links
- Global, weekly, monthly and friends leaderboards showing profile pictures, usernames, levels and XP
- Achievements for First Study Session, 5-Hour Learner, 7-Day Streak, 30-Day Streak, Quest Master and XP Champion
- Secure admin dashboard to manage students, materials, PDF uploads, quests, XP rewards, store products, themes, memberships, website links, analytics and leaderboard moderation
- Working buttons, working navigation, no fake statistics, no dead links, no placeholder interactions, mobile responsiveness, fast loading, smooth animations, secure user data, error messages, loading states, empty states, functional search and persistent storage

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Backend compiles with mops check --fix and mops build from src/backend; frontend compiles with pnpm typecheck and pnpm fix from src/frontend; bindings regenerate with pnpm bindgen from the repo root.
- A mo:caffeineai-* import needs its package declared in mops.toml; mops add caffeineai-object-storage fixes M0010.
- Motoko module-level let must be a static literal; inline computed constants instead of arithmetic on other bindings.
- Map and Set operations need the key type's module imported in the same file for the implicit compare (M0230): Principal for Map<Principal,_>, Nat for Map<Nat,_>, Text for Text keys.
- OQL auto-derive needs a <Type>Value.mo module per variant field, imported top-level in the entity-declaring file, and .sample must set every optional field to a non-null dummy or the column reports type Null.
- Private funcs with the same name in two included mixins collide in the actor block; rename one.
- Backend day and week keys are UTC: DayKey is YYYY-MM-DD and WeekKey is YYYY-Www from a Monday-start week; the frontend replicates weekKeyOf to call the weekly endpoints.
- Generated backend enums such as PlanTier, StoreItemKind, AchievementKey and LeaderboardScope must be imported as values from @/backend, not through the type-only re-export in @/types.
- No Toaster is mounted in main.tsx, so page feedback uses inline status panels rather than sonner toasts.
- TanStack Router code-based routes need literal path strings per createRoute; a dynamic path helper erases the literal type and breaks Link type-safety.
- useActor(createActor) hooks must live inside the sign-in gate's subtree; AppShell calls useIsAdmin so it renders inside the gate, not in App.
- ResourceView.file is an ExternalBlob instance; use file.getDirectURL() for both the iframe PDF viewer source and the download anchor href.
- Brand strings can drift between the static index.html and the React shell chrome; grep the brand name across the whole frontend, not just pages.
