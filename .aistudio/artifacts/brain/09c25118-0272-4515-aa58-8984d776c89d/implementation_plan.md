# Modular Architecture Decomposition for Rockies Albion 14

Decompose the monolithic application into cleanly separated, single-responsibility modules (`style.css`, `firebase.js`, `roster.js`, `tracker.js`, `schedule.js`, `standings.js`, and `index.html`) so each subsystem can be developed, styled, and maintained independently without full-system rewrites.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Architecture Strategy**: Based on your feedback, we will **not** combine schedule and standings into the main script. Instead, we will adopt a clean, fully decoupled multi-module architecture:
> 1. `style.css`: Dedicated stylesheet for Rockies branding, custom scrollbars, badges, and layout utilities.
> 2. `firebase.js`: Centralized data layer handling Firebase/Firestore initialization, authentication, real-time snapshot sync, video chunk storage, and offline fallback.
> 3. `roster.js`: Dedicated player roster module managing player records, stat calculations (goals, assists, stops, MOTM awards), family details, and player card interactions.
> 4. `tracker.js`: Dedicated match tracker module managing match clocks, period transitions, play-by-play events, stats comparisons, shootouts, and match history.
> 5. `schedule.js`: Dedicated fixtures module managing game/practice schedules, uniform kits, filters, and opponent standing record lookups.
> 6. `standings.js`: Dedicated league table module managing official CMSA standings, table sorting, coach editor, and AI screenshot extraction.
> 7. `index.html`: Clean, semantic HTML skeleton containing structural markup, accessible dialogs, and ES module script imports.

---

### 1. Overview & Core Concept

- **What It Delivers**: A clean, modular codebase where individual features (such as scheduling updates, standings adjustments, or scoring logic) can be modified, tested, and upgraded in isolation without touching unrelated application code.
- **Target Audience**: Calgary Rockies FC Albion 14 coaching staff (game management, lineups, scorekeeping) and team families/players (schedules, uniform requirements, match stats, and player profile highlights).
- **Core Value**: Maintainability, fault isolation, and faster iterations. A bug or change in league standings won't impact the live match scoreboard or roster calculations.

---

### 2. User Experience & Visual Design

- **Visual Consistency**: Preserve 100% of the established Calgary Rockies FC identity:
  - Deep Navy Canvas (`#090d16`), Royal Blue brand surfaces (`#003C71`), Gold accents (`#FFB81C`), and clean emerald/rose status signifiers.
- **Ergonomics & Layout Rhythm**:
  - Desktop: Full 1440px multi-column layout with 2–4 column player and fixture grids.
  - Mobile Touch: Touch targets $\ge 44\text{px}$, sticky top bar with mode toggle and cloud sync indicator, and natural thumb-friendly action buttons.
- **Clean Typography**: Inter / Plus Jakarta Sans display hierarchy, paired with tabular monospace numerals (`tabular-nums`) for timers, match stats, and standings points.
- **Zero Pill Discipline**: Information tags and fixture metadata use unboxed text with subtle typographic separators (`·` or `/`), reserving rounded button surfaces strictly for actionable filters and controls.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modular Decomposition Granularity**
  - *Chosen Approach*: Distinct domain modules (`roster.js`, `tracker.js`, `schedule.js`, `standings.js`, `firebase.js`) imported by an orchestrating entry point.
  - *Why*: Direct response to your feedback. Isolates concerns so fixture updates or standings changes never risk regressing live match score tracking or player media.
  - *Alternatives Considered*: Bundled monolith (rejected as brittle for future enhancements).
- **Decision 2: Universal Data & Event Bus**
  - *Chosen Approach*: `firebase.js` exports pure data-store methods and event subscribers that individual modules listen to, ensuring data flows reactively across modules without tight coupling.
  - *Why*: When a goal is logged in `tracker.js`, `roster.js` and `standings.js` immediately reflect the updated goals and points automatically.

---

### 4. Technical Architecture & Data Strategy

#### System Module Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 index.html                                  │
│             (Semantic DOM, Accessible Modals, Module Linkage)               │
└───────┬─────────────────────────────────────────────────────────────┬───────┘
        │                                                             │
        ▼                                                             ▼
┌───────────────┐                                             ┌───────────────┐
│   style.css   │                                             │    app.js     │
│(Theme Tokens, │                                             │(App Shell &   │
│Scrollbar & RFC│                                             │Tab Controller)│
│ Utilities)    │                                             └───────┬───────┘
└───────────────┘                                                     │
                                                                      │
        ┌───────────────────┬───────────────────┬─────────────────────┼──────────────────┐
        ▼                   ▼                   ▼                     ▼                  ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐     ┌───────────────┐  ┌───────────────┐
│   roster.js   │   │  tracker.js   │   │  schedule.js  │     │ standings.js  │  │  firebase.js  │
│(12 Players,   │   │(Live Timer,   │   │(38 Fixtures,  │     │(CMSA Table,   │  │(Firestore,    │
│Stats Calc,    │   │Play-by-Play,  │   │Kit Uniforms,  │     │Coach Editor,  │  │Auth Session,  │
│Family Profiles│   │Shootout, MOTM)│   │Opponent Look- │     │AI Scanner)    │  │Video Chunks,  │
│& Highlights)  │   │               │   │up Linkage)    │     │               │  │Offline Cache) │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘     └───────┬───────┘  └───────┬───────┘
        │                   │                   │                     │                  │
        └───────────────────┴───────────────────┴─────────────────────┴──────────────────┘
                                                │
                                                ▼
                                   ┌───────────────────────────┐
                                   │  Firebase Cloud / Offline │
                                   │  Local State Persistence  │
                                   └───────────────────────────┘
```

#### Module Responsibilities
1. **`style.css`**: Complete extraction of all Tailwind imports, CSS variables, Rockies Blue (`#003C71`) / Gold (`#FFB81C`) tokens, and custom scrollbar rules.
2. **`firebase.js`**:
   - Firebase app initialization and anonymous/token auth.
   - Real-time Firestore sync listeners (`matchCenter`, `playerProfiles`, `teamPortal`).
   - Chunked video upload and base64 media resolution.
   - Offline fallback using browser storage.
3. **`roster.js`**:
   - Player roster state & profile mapping.
   - Dynamic stat aggregations (`getPlayerStats`, `getPlayerRecentHighlights`).
   - Profile modal, family profile editor, and photo lightbox management.
4. **`tracker.js`**:
   - Scoreboard state, game clock timer, half-time and period transitions.
   - Goal, opponent goal, and defensive play logging with video clip lightbox support.
   - Penalty shootout calculation and stats comparison bars.
   - Match archiving and past match history editor.
5. **`schedule.js`**:
   - Complete 38-event authentic CMSA fixture schedule.
   - Filtering (`all`, `game`, `practice`), uniform guide, and Google Maps routing.
   - Cross-module linkage: querying opponent rank, GP, and record from `standings.js`.
6. **`standings.js`**:
   - Official CMSA Boys U13 Tier 2 league table calculation and point sorting.
   - In-place standings editor for coaches.
   - AI screenshot scanner preview and apply workflow.
7. **`index.html`**:
   - Minimized, pristine markup with clean structure, modal templates, and zero inline scripts.
