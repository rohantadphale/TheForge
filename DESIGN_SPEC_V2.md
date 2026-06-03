# Arise — Design Spec V2
**Codename:** TheForge | **Status:** V1 Implementation Target

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| Display name | `Arise` (configurable, stored in `app_settings`) |
| Codename | TheForge |
| First user | Rohi |
| Positioning | Personal progression system for Health, Wealth, Happiness, and Mastery |
| Core fantasy | A "System" trains the user through quests, trials, ranks, and companions — not a to-do list |
| Tone | Mythic, sharp, slightly dramatic, practical |

**Critical constraint:** The product name must never be hardcoded in UI components. All display branding — `app_name`, `app_subtitle`, `system_name` — is read from the `app_settings` table and served via `GET /api/settings`. The frontend reads these at startup and applies them globally.

---

## 2. Product Promise

- Goals → Quests
- Completed work → XP, Gold, attribute growth, evidence
- Consistency → Rank progression
- Rewards → Companions, cosmetics, boons
- Reflection → Better plans

V1 targets Senior SWE interview prep. The architecture must support Health, Wealth, and Happiness without rebuild.

---

## 3. Core Pillars

1. **Progression over productivity** — "What am I becoming?" before "What did I check off?"
2. **Proof-based rewards** — XP and Gold tied to completing quests, not opening them.
3. **Daily clarity** — Dashboard shows today's quests immediately on load.
4. **Expandable life system** — Senior SWE prep is the first campaign, not the whole product.
5. **Companions with personality** — At least one companion with distinct states and commentary.

---

## 4. Life Domains

| Domain | Focus Areas |
|--------|-------------|
| Health | Fitness, sleep, nutrition, energy, body composition |
| Wealth | Career, compensation, financial habits, job search |
| Happiness | Relationships, hobbies, mindfulness, rest, creativity |
| Mastery | SWE prep, DSA, system design, Python, Go, PyTorch, communication |

---

## 5. Attributes

| Key | Name | Domain | Icon |
|-----|------|--------|------|
| `strength` | Strength | Health | 💪 |
| `vitality` | Vitality | Health | 🫀 |
| `intelligence` | Intelligence | Mastery | 🧠 |
| `wisdom` | Wisdom | Mastery | 🦉 |
| `discipline` | Discipline | Mastery | ⚔️ |
| `charisma` | Charisma | Happiness | 🗣️ |
| `fortune` | Fortune | Wealth | 💰 |
| `spirit` | Spirit | Happiness | ✨ |

Attributes are scores (integer, no upper cap in V1). A quest's `attribute_rewards` field specifies which attributes gain points on completion. One quest can affect multiple attributes.

---

## 6. Ranks

| Sort Order | Label | Min Total XP |
|-----------|-------|-------------|
| 0 | Unawakened | 0 |
| 1 | E-Rank | 500 |
| 2 | D-Rank | 1,500 |
| 3 | C-Rank | 4,000 |
| 4 | B-Rank | 10,000 |
| 5 | A-Rank | 25,000 |
| 6 | S-Rank | 60,000 |
| 7 | National-Level | 150,000 |
| 8 | Mythic | 400,000 |
| 9 | Transcendent | 1,000,000 |

**Rank computation:** Current rank = highest rank where `user.total_xp >= rank.min_xp`. Computed server-side on every profile fetch; not stored directly on the profile row.

**Level formula:** `level = min(floor(total_xp / 100) + 1, 100)` — global, not reset per rank.

---

## 7. Currencies

### XP
Drives level and rank. Never spendable. Awarded on quest completion.

### Gold
Spendable. Awarded on completion. Spent on companions and boons (boon shop deferred to V2).

### Reward Formula Defaults

| Quest Type | Default XP | Default Gold | Attribute Points (each listed attr) |
|------------|-----------|--------------|-------------------------------------|
| `daily` | 50 | 10 | 3 |
| `weekly` | 200 | 50 | 10 |
| `campaign` | 150 | 30 | 8 |
| `trial` | 500 | 100 | 20 |
| `reflection` | 25 | 5 | 2 |
| `recovery` | 20 | 5 | 1 |

These are defaults only. Individual quests store their own `xp_reward` and `gold_reward` fields and can override defaults. The seed script populates quests with these defaults; no separate "formula config" table needed in V1.

---

## 8. Quest Types (V1)

| Type | Description | Recurrence |
|------|-------------|------------|
| `daily` | Small recurring task | daily |
| `weekly` | Larger recurring goal | weekly |
| `campaign` | Milestone in a long campaign | none |
| `trial` | Assessment for rank progression | none |
| `reflection` | Short written check-in | daily or none |
| `recovery` | Low-pressure fallback for missed days | none |

**Deferred:** `raid`, `dungeon`, `bounty`, `oath` — do not build in V1, do not stub endpoints.

---

## 9. V1 Campaign: Senior SWE Prep

**Campaign name:** Senior SWE Prep  
**Domain:** Mastery  
**is_active:** true (only one active campaign in V1)

Seed with these 5 daily quests (all `recurrence=daily`, linked to this campaign):

| Title | XP | Gold | Attribute Rewards |
|-------|-----|------|-------------------|
| Solve 1 DSA problem | 50 | 10 | `[{"key":"intelligence","points":5},{"key":"discipline","points":2}]` |
| System design review block | 50 | 10 | `[{"key":"intelligence","points":3},{"key":"wisdom","points":4}]` |
| Go or Python language block | 50 | 10 | `[{"key":"intelligence","points":4},{"key":"discipline","points":3}]` |
| Read 1 system design article | 30 | 5 | `[{"key":"wisdom","points":4}]` |
| Daily reflection | 25 | 5 | `[{"key":"wisdom","points":2},{"key":"discipline","points":2}]` |

Seed these 2 weekly quests:

| Title | XP | Gold | Attribute Rewards |
|-------|-----|------|-------------------|
| Complete mock interview or timed practice | 200 | 50 | `[{"key":"intelligence","points":10},{"key":"charisma","points":10}]` |
| Write system design doc | 200 | 50 | `[{"key":"wisdom","points":12},{"key":"intelligence","points":8}]` |

---

## 10. Companion: Axiom

V1 ships one companion, fully implemented. Do not stub a second.

| Field | Value |
|-------|-------|
| Name | Axiom |
| Role | System Guide |
| Domain | Mastery |
| Persona | Sharp, mildly sarcastic, action-focused, allergic to excuses |
| Bio | The System's first manifest agent. Axiom appeared when the Hunter awakened. Nobody knows if it chose this role or was assigned it. |
| is_unlocked | true (pre-unlocked, no cost) |
| unlock_cost_gold | 0 |
| Default state | `idle` |

### Companion States

| State | CSS Class | Trigger | Duration |
|-------|-----------|---------|----------|
| `idle` | `companion--idle` | Default | Permanent |
| `studying` | `companion--studying` | Time of day 06:00–20:00 when no quest completed recently | Permanent while active |
| `celebrating` | `companion--celebrating` | Quest marked complete | 3 seconds, then return to `idle` |
| `briefing` | `companion--briefing` | Dashboard first load of the day | 5 seconds, then return to `idle` |

### Companion Animation Spec (CSS only — no external libs)

```css
@keyframes companionIdle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes companionCelebrate {
  0%, 100% { transform: scale(1) translateY(0); }
  25% { transform: scale(1.1) translateY(-10px); }
  75% { transform: scale(0.95) translateY(-4px); }
}
@keyframes companionBriefing {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 12px 4px rgba(124, 58, 237, 0.4); }
}

.companion--idle { animation: companionIdle 2s ease-in-out infinite; }
.companion--studying { animation: companionIdle 3s ease-in-out infinite; filter: brightness(0.85); }
.companion--celebrating { animation: companionCelebrate 0.5s ease-in-out infinite; }
.companion--briefing { animation: companionBriefing 1.5s ease-in-out infinite; }
```

The companion widget is a fixed-size box (128×128px or 160×160px) rendered as a dark themed SVG character or styled div with emoji/icon. No external image assets required in V1.

### Companion Message Pools (hardcoded in frontend)

Each array must have ≥ 8 entries. Sample:

```typescript
const MESSAGES = {
  idle: [
    "Waiting. Don't make a habit of it.",
    "The System observes. The Hunter hesitates.",
    "Another day. Another choice.",
  ],
  celebrating: [
    "Quest cleared. That's how it's done.",
    "Progress recorded. Keep moving.",
    "The System approves. Barely.",
  ],
  briefing: [
    "Today's objectives are loaded. Execute.",
    "A new day. Same mission. Different you — maybe.",
  ],
};
```

---

## 11. Dashboard

The dashboard is the primary surface. It is not a marketing page.

**Required panels (V1):**

| Panel | Content |
|-------|---------|
| Header | `app_name` + `app_subtitle` from settings; `display_name`; `system_name` label |
| Rank + Level | Current rank label, level number, XP bar (current XP toward next rank threshold) |
| Currency Bar | Total XP value + Gold balance |
| Today's Quests | All daily/weekly quests due today; each shows title, type badge, rewards, Complete button |
| Active Campaign | Campaign name + completion count for current week |
| Attributes | 8 attributes as icon + name + score + narrow progress bar |
| Companion Widget | Axiom with active CSS state + current message |
| Daily Briefing | Short text block: "The System says: [message]" — pull from hardcoded pool, rotate daily by day-of-year index |

**Dashboard data source:** Single `GET /api/dashboard` call on load. Backend aggregates and returns all needed data. Do not make separate per-panel API calls on dashboard load.

---

## 12. Data Model (SQL DDL)

```sql
-- AppSettings: single row, id always 1
CREATE TABLE IF NOT EXISTS app_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),
  app_name      TEXT NOT NULL DEFAULT 'Arise',
  app_subtitle  TEXT NOT NULL DEFAULT 'Your personal progression system',
  system_name   TEXT NOT NULL DEFAULT 'The System',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- UserProfile: single row, id always 1
CREATE TABLE IF NOT EXISTS user_profile (
  id            INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),
  display_name  TEXT NOT NULL DEFAULT 'Hunter',
  total_xp      INTEGER NOT NULL DEFAULT 0,
  gold          INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 1,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ranks
CREATE TABLE IF NOT EXISTS ranks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT NOT NULL,
  min_xp     INTEGER NOT NULL,
  sort_order INTEGER NOT NULL UNIQUE
);

-- Attributes
CREATE TABLE IF NOT EXISTS attributes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  domain      TEXT NOT NULL CHECK(domain IN ('Health','Wealth','Happiness','Mastery')),
  score       INTEGER NOT NULL DEFAULT 0,
  icon        TEXT NOT NULL DEFAULT '⭐'
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  domain      TEXT NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Quests
CREATE TABLE IF NOT EXISTS quests (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  title             TEXT NOT NULL,
  description       TEXT,
  quest_type        TEXT NOT NULL CHECK(quest_type IN ('daily','weekly','campaign','trial','reflection','recovery')),
  campaign_id       INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  xp_reward         INTEGER NOT NULL DEFAULT 50,
  gold_reward       INTEGER NOT NULL DEFAULT 10,
  -- JSON: [{"key": "intelligence", "points": 5}, ...]
  attribute_rewards TEXT NOT NULL DEFAULT '[]',
  recurrence        TEXT NOT NULL DEFAULT 'none' CHECK(recurrence IN ('none','daily','weekly')),
  -- ISO date YYYY-MM-DD; null for recurring quests (due = today always)
  due_date          TEXT,
  is_archived       INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Quest Completions
CREATE TABLE IF NOT EXISTS quest_completions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id         INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  completed_date   TEXT NOT NULL,  -- YYYY-MM-DD, today's date at completion time
  xp_awarded       INTEGER NOT NULL,
  gold_awarded     INTEGER NOT NULL,
  -- JSON snapshot of changes applied: [{"key": "intelligence", "points": 5}]
  attribute_changes TEXT NOT NULL DEFAULT '[]',
  notes            TEXT,
  completed_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Prevent completing the same recurring quest twice in one day
CREATE UNIQUE INDEX IF NOT EXISTS idx_completion_quest_date
  ON quest_completions(quest_id, completed_date);

-- Companions
CREATE TABLE IF NOT EXISTS companions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  role              TEXT NOT NULL,
  domain            TEXT NOT NULL,
  persona           TEXT NOT NULL,
  bio               TEXT,
  is_unlocked       INTEGER NOT NULL DEFAULT 0,
  unlock_cost_gold  INTEGER NOT NULL DEFAULT 0,
  unlock_condition  TEXT,
  current_state     TEXT NOT NULL DEFAULT 'idle'
                    CHECK(current_state IN ('idle','studying','celebrating','briefing')),
  sort_order        INTEGER NOT NULL DEFAULT 0
);

-- Reflections (short written check-ins)
CREATE TABLE IF NOT EXISTS reflections (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_completion_id  INTEGER REFERENCES quest_completions(id) ON DELETE SET NULL,
  content              TEXT NOT NULL,
  xp_awarded           INTEGER NOT NULL DEFAULT 25,
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Weekly Reviews
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start       TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD, always a Monday
  summary          TEXT,
  xp_gained        INTEGER NOT NULL DEFAULT 0,
  gold_gained      INTEGER NOT NULL DEFAULT 0,
  quests_completed INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 13. API Contract

FastAPI runs on `http://localhost:8000`. Vite dev server proxies `/api → http://localhost:8000`. All endpoints return JSON. All errors return `{"detail": "..."}` with appropriate HTTP status.

### Settings
| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/settings` | — | `AppSettings` |
| PUT | `/api/settings` | `{app_name?, app_subtitle?, system_name?}` | `AppSettings` |

### Profile
| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | `/api/profile` | — | `UserProfile` + `current_rank: Rank` |
| PUT | `/api/profile` | `{display_name}` | `UserProfile` |

### Dashboard
| Method | Path | Response |
|--------|------|----------|
| GET | `/api/dashboard` | `{profile, current_rank, next_rank, today_quests, weekly_quests, active_campaign, companion, attributes, settings}` |

This is the only aggregating endpoint. Computes everything in one DB round-trip.

### Ranks
| Method | Path | Response |
|--------|------|----------|
| GET | `/api/ranks` | `Rank[]` ordered by `sort_order` |

### Attributes
| Method | Path | Response |
|--------|------|----------|
| GET | `/api/attributes` | `Attribute[]` |

### Campaigns
| Method | Path | Response |
|--------|------|----------|
| GET | `/api/campaigns` | `Campaign[]` |
| GET | `/api/campaigns/{id}` | `Campaign` + `quests: Quest[]` |

### Quests
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/quests` | Query params: `type`, `campaign_id`, `date` (YYYY-MM-DD), `archived` (0/1) |
| POST | `/api/quests` | Create quest; returns `Quest` |
| GET | `/api/quests/{id}` | Single quest |
| PUT | `/api/quests/{id}` | Update quest fields; returns `Quest` |
| DELETE | `/api/quests/{id}` | Soft-delete: sets `is_archived=1`; returns `{"ok": true}` |
| POST | `/api/quests/{id}/complete` | See completion flow below |

**`POST /api/quests/{id}/complete` body:** `{"notes": "optional string", "date": "YYYY-MM-DD"}` — `date` defaults to today server-side if omitted.

**Completion flow (server-side, atomic):**
1. Load quest. 404 if not found or archived.
2. Check `quest_completions` for `(quest_id, date)` pair. Return **409 Conflict** if exists.
3. Insert `quest_completions` row with rewards snapshot.
4. `UPDATE user_profile SET total_xp = total_xp + ?, gold = gold + ?, level = min(floor((total_xp + ?) / 100) + 1, 100)`.
5. For each entry in `attribute_rewards`: `UPDATE attributes SET score = score + ? WHERE key = ?`.
6. Determine `old_rank` (before) and `new_rank` (after) from ranks table.
7. Return:
```json
{
  "completion": {...},
  "new_total_xp": 350,
  "new_gold": 80,
  "new_level": 4,
  "rank_changed": false,
  "new_rank": { "label": "E-Rank", ... },
  "attribute_changes": [{"key": "intelligence", "name": "Intelligence", "new_score": 42}]
}
```

### Companions
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/companions` | All companions |
| POST | `/api/companions/{id}/unlock` | Check gold >= cost; deduct gold; set `is_unlocked=1`. 400 if insufficient gold. |
| PUT | `/api/companions/{id}/state` | Body: `{"state": "idle"}`. Validates against enum. |

### Reflections
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/reflections` | Body: `{"content": "...", "quest_completion_id": null}`. Awards 25 XP. |

### Weekly Review
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/weekly` | Query: `?week_start=YYYY-MM-DD`. Computes live from `quest_completions` if no saved review. |
| POST | `/api/weekly` | Body: `{"week_start": "...", "summary": "..."}`. Upserts review row. |

---

## 14. Frontend Routes & Components

### Routes (React Router v6)

| Path | Page Component | Notes |
|------|---------------|-------|
| `/` | `DashboardPage` | Primary view |
| `/quests` | `QuestListPage` | Filterable by type/campaign |
| `/quests/new` | `QuestFormPage` | Create mode |
| `/quests/:id/edit` | `QuestFormPage` | Edit mode |
| `/campaign` | `CampaignPage` | Active campaign detail |
| `/attributes` | `AttributesPage` | All 8 attributes with detail |
| `/weekly` | `WeeklyPage` | Weekly summary + reflection |
| `/settings` | `SettingsPage` | App name, profile name |

Global `<Layout>` wraps all pages. Layout includes left sidebar nav and top bar with `app_name`.

### Key Components

```
src/
  api/
    client.ts          # axios instance, base URL from env or localhost:8000
    settings.ts        # getSettings, updateSettings
    profile.ts         # getProfile, updateProfile
    dashboard.ts       # getDashboard
    quests.ts          # getQuests, createQuest, updateQuest, deleteQuest, completeQuest
    companions.ts      # getCompanions, unlockCompanion, setCompanionState
    weekly.ts          # getWeekly, saveWeekly
    reflections.ts     # createReflection

  stores/
    useAppStore.ts     # Zustand store: settings, profile, companion state

  components/
    Layout.tsx
    Sidebar.tsx
    QuestCard.tsx      # title, type badge, XP/Gold, Complete button
    QuestList.tsx      # filtered list
    RankBadge.tsx      # rank label + XP progress bar to next rank
    AttributeGrid.tsx  # 8 attrs: icon + name + score + bar
    CurrencyBar.tsx    # XP total + Gold
    CompanionWidget.tsx # Axiom with CSS state + rotating message
    DailyBriefing.tsx  # "The System says:" text block
    CompletionToast.tsx # XP/Gold gained popup; rank-up banner if rank changed

  pages/
    DashboardPage.tsx
    QuestListPage.tsx
    QuestFormPage.tsx
    CampaignPage.tsx
    AttributesPage.tsx
    WeeklyPage.tsx
    SettingsPage.tsx
```

**State management:** Zustand for global state (settings, profile, companion). TanStack Query (React Query) for all server data — cache + invalidate on mutations.

**On quest complete:**
1. Call `completeQuest(id)` → get response with XP/Gold diff and rank info.
2. Show `CompletionToast` with earned rewards for 4 seconds.
3. If `rank_changed`, show rank-up banner overlay for 3 seconds.
4. Set companion state to `celebrating` for 3 seconds (client-side timer), then back to `idle`.
5. Invalidate TanStack Query cache for `dashboard` and `quests`.

---

## 15. Visual Style

Dark theme. No light mode in V1.

```css
:root {
  --bg-base: #0a0a0f;
  --bg-surface: #111118;
  --bg-elevated: #1a1a24;
  --border: #1e1e2e;
  --primary: #7c3aed;       /* violet — rank, XP */
  --primary-dim: #4c1d95;
  --gold: #f59e0b;          /* amber — currency */
  --gold-dim: #78350f;
  --success: #10b981;
  --danger: #ef4444;
  --text-primary: #e2e8f0;
  --text-muted: #64748b;
  --text-dim: #374151;
}
```

Font: `'JetBrains Mono'` for labels/numbers, `'DM Sans'` or system fallback for body. Load from Google Fonts CDN. If offline, fall back to `monospace` and `system-ui`.

Layout: Fixed left sidebar (220px) + main content area. No top navbar overlap with sidebar.

Component style: Tailwind CSS utility classes. Configure `tailwind.config.js` with the above CSS vars as extended colors.

---

## 16. Directory Structure

```
theforge/
├── backend/
│   ├── main.py              # FastAPI app, CORS, router mounts
│   ├── database.py          # SQLite connection, get_db()
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic v2 schemas (request/response)
│   ├── seed.py              # Idempotent seed script
│   ├── routers/
│   │   ├── settings.py
│   │   ├── profile.py
│   │   ├── dashboard.py
│   │   ├── quests.py        # includes /complete endpoint
│   │   ├── campaigns.py
│   │   ├── companions.py
│   │   ├── attributes.py
│   │   ├── reflections.py
│   │   └── weekly.py
│   ├── requirements.txt
│   └── theforge.db          # gitignored; created on first run
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── index.css        # Tailwind directives + CSS vars
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
├── tests/
│   ├── test_quests.py
│   ├── test_completion.py
│   └── test_progression.py
├── DESIGN_SPEC.md
└── README.md
```

---

## 17. Dev Setup

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic pytest httpx
python seed.py          # seed database (idempotent)
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npm install @tanstack/react-query zustand react-router-dom axios
npx tailwindcss init -p
npm run dev             # runs on http://localhost:5173
```

**CORS:** FastAPI must allow `http://localhost:5173` from day one.

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Vite proxy:**
```typescript
// vite.config.ts
server: { proxy: { '/api': 'http://localhost:8000' } }
```

---

## 18. Seed Data Spec

`seed.py` must be **idempotent** (safe to run multiple times). Use `INSERT OR IGNORE` or existence checks.

Must seed in order:
1. `app_settings` row (id=1)
2. `user_profile` row (id=1)
3. All 10 `ranks` (from table in §6)
4. All 8 `attributes` (from table in §5)
5. Senior SWE Prep `campaign` (is_active=1)
6. 5 daily quests + 2 weekly quests for the campaign (from §9)
7. Axiom `companion` (is_unlocked=1)

---

## 19. Non-Goals (V1)

Do not build. Do not stub endpoints. Do not leave TODOs in code that imply these are coming:

- Authentication or multi-user support
- Habit streaks or XP decay
- `raid`, `dungeon`, `bounty`, `oath` quest types
- Multiple companions or companion unlock shop UI
- AI/LLM integration of any kind
- Apple Health or external service integrations
- Push notifications or background jobs
- Tauri packaging
- Code execution sandbox
- `Essence`, `Keys`, `Favor` currencies
- Derived/compound attribute formulas
- Dark/light theme toggle
- i18n or localization
- Mobile-first layout (responsive is fine, mobile-first is not a target)

---

## 20. Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Companion feels like a generic emoji box | High | Use SVG character or CSS art; write distinct message pools |
| CORS errors blocking dev loop | Medium | Configure CORS on day 1; include in Phase 1 acceptance test |
| `attribute_rewards` JSON not parsed correctly on completion | High | Validate JSON parse in backend; unit test completion endpoint |
| Scope creep (AI features, second companion) | High | Refuse; reference Non-Goals list above |
| Reward numbers feel arbitrary in practice | Medium | XP/Gold per quest editable in DB; document how to tune |
| SQLite locking on rapid completions | Low | Single user local app; not a real risk |
| Google Fonts CDN breaks offline use | Low | Specify system font fallbacks in CSS |

---

## 21. Acceptance Criteria (Testable)

All criteria must pass before V1 is complete.

1. `GET /api/dashboard` returns HTTP 200 with all required fields: `profile`, `current_rank`, `next_rank`, `today_quests`, `active_campaign`, `companion`, `attributes`, `settings`.
2. `POST /api/quests/{id}/complete` on a `daily` quest returns HTTP 200 with `new_total_xp`, `new_gold`, `new_level`, `rank_changed`, `attribute_changes`.
3. `POST /api/quests/{id}/complete` on the same quest same date returns HTTP 409.
4. `PUT /api/settings` with `{"app_name": "TheForge"}` → subsequent `GET /api/dashboard` returns `settings.app_name = "TheForge"`.
5. Creating, editing, and deleting a quest from the UI persists correctly after page refresh.
6. Completing a quest from the dashboard triggers the `celebrating` CSS state on the companion for 3 seconds then reverts to `idle`.
7. Completing a quest shows a toast with the exact XP and Gold earned.
8. If a completion crosses a rank threshold, a rank-up banner appears.
9. `GET /api/weekly?week_start=YYYY-MM-DD` returns correct aggregate totals for a seeded week.
10. Killing and restarting the backend preserves all data in `theforge.db`.
11. The app loads and functions fully with the network disabled (no CDN-dependent features broken; font fallback is acceptable).
12. All pytest tests in `tests/` pass.

---

## 22. Suggested Build Order

1. Project scaffold (dirs, config files, CORS, Vite proxy, Tailwind).
2. SQLite schema (`database.py`, `models.py`).
3. Seed script (`seed.py`) — verify with `sqlite3 theforge.db ".tables"`.
4. FastAPI routers: settings, profile, attributes, ranks, campaigns, companions (read-only first).
5. Quest CRUD endpoints (no completion yet).
6. Quest completion endpoint with full reward logic — write tests here.
7. `GET /api/dashboard` aggregation endpoint.
8. React frontend: routing, layout, API client, Zustand store.
9. Dashboard page — connects to `/api/dashboard`.
10. Quest list + form pages (CRUD).
11. Completion flow in UI: toast, rank-up banner, companion state change.
12. Companion widget with CSS animations and message pool.
13. Settings page — live update of `app_name`.
14. Weekly summary page.
15. Full pytest test suite for backend reward logic.
16. README with setup instructions.
