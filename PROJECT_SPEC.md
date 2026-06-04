# Tamil Nadu AI Grievance Routing App — Full Technical Specification

> **Purpose:** AI-powered citizen grievance filing and government department routing system with real-time admin dashboard.
> **Scale Target:** This document describes the current V1 implementation to serve as input for a V2 architecture document covering production-scale deployment.

---

## 1. Executive Summary

The **TN AI Grievance App** is a dual-panel web application:
- **Citizen Side (UserApp):** Mobile-first interface for filing complaints via text, voice, or AI chatbot. Auto-detects the relevant government department using hybrid NLP (keyword + LLM fallback).
- **Admin Side (AdminApp):** Desktop dashboard for government officers to view, assign, and track grievances with live notifications.

**Key Innovation:** Hybrid AI routing — fast offline keyword matching (<10ms) with LLM API fallback for ambiguous queries.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2.6 |
| Build Tool | Vite | 8.0.16 |
| Styling | CSS3 with CSS Variables | — |
| Icons | Lucide React | Latest |
| Fonts | Google Fonts (Outfit, Rajdhani, Noto Sans Tamil) | — |
| State Management | React Context API + localStorage | — |
| Database (Current) | localStorage (mock) + Supabase (live) | PostgreSQL 15 |
| LLM Integration | Groq/OpenAI-compatible API | GPT-4o-mini / llama-3.1-8b |
| Geolocation | OpenStreetMap Nominatim API | Free tier |
| Voice Input | Web Speech API (webkitSpeechRecognition) | Browser native |
| Speech-to-Text | Browser native + Groq Whisper (planned) | — |
| Hosting | Vercel (frontend) + Supabase (backend) | — |

---

## 3. Project Structure

```
TNapp/
├── index.html                    # Entry HTML with font preloads
├── package.json                  # Dependencies & scripts
├── .env                          # Secrets (gitignored)
├── .env.example                  # Template for env vars
├── vite.config.js                # Vite build configuration
├── src/
│   ├── main.jsx                  # React DOM entry point
│   ├── App.jsx                   # Root component with hash routing
│   ├── index.css                 # Global styles, CSS variables, animations
│   ├── App.css                   # Component-scoped styles
│   ├── context/
│   │   └── AppContext.jsx        # Global state: complaints, settings, sync
│   ├── views/
│   │   ├── UserApp.jsx           # Citizen mobile app (~1400 lines)
│   │   └── AdminApp.jsx          # Admin desktop dashboard (~900 lines)
│   ├── utils/
│   │   ├── db.js                 # Data layer: Supabase + localStorage fallback
│   │   ├── nlpRouting.js         # Hybrid AI department detection
│   │   └── supabase.js           # Supabase client initialization
│   └── assets/
│       ├── hero.png              # App branding
│       ├── react.svg, vite.svg   # Framework logos
│       └── favicon.svg           # Browser tab icon
└── public/
    ├── favicon.svg
    └── icons.svg                 # Sprite sheet for inline icons
```

---

## 4. Core Features Implemented

### 4.1 Citizen App (UserApp)

| Feature | Status | Details |
|---|---|---|
| Splash Screen | ✅ | Animated TN-branded intro with loading |
| Home Dashboard | ✅ | Quick actions, department shortcuts, alerts |
| AI Chatbot | ✅ | NLP-powered grievance detection + LLM fallback |
| Voice Input | ✅ | Web Speech API with Tamil/English toggle |
| Complaint Wizard | ✅ | 5-step: Location → Dept → Description → Photo → Review |
| GPS Location | ✅ | Reverse geocoding via Nominatim (place names) |
| Location Search | ✅ | OpenStreetMap autocomplete with suggestions dropdown |
| Photo Capture | ✅ | Camera/file upload with base64 preview |
| Grievance Tracking | ✅ | Progress bars, status timeline, live updates |
| Notifications | ✅ | Unread badges, status change alerts |
| Welfare Schemes | ✅ | Filterable scheme directory |
| Emergency Dials | ✅ | One-tap emergency numbers |
| Profile | ✅ | Mock user profile with settings |

### 4.2 Admin App (AdminApp)

| Feature | Status | Details |
|---|---|---|
| Dashboard | ✅ | Stats cards, emergency strip, department load chart |
| Department Directory | ✅ | Grid of 17 TN departments with icons |
| Grievance Board | ✅ | Filterable data table, status badges |
| Complaint Detail Modal | ✅ | Full view, officer assignment, status buttons |
| Emergency Control | ✅ | Active/resolved emergency scenarios |
| Officer Roster | ✅ | Department-filtered officer list |
| Analytics | ✅ | Mock charts (pie, bar, line) |
| AI Logs | ✅ | Query history with token counts |
| Notifications | ✅ | Unread system alerts |
| Settings | ✅ | Supabase config, LLM config, theme toggle |
| Live Toast Notifications | ✅ | Slide-in toasts for new complaints |

---

## 5. Routing & Navigation

### URL Hash-Based Routing (No react-router-dom)

| URL | Panel | Screen |
|---|---|---|
| `http://localhost:5173/` | UserApp | Home |
| `http://localhost:5173/#/admin` | AdminApp | Dashboard |

**Implementation:** `window.location.hash` listener in `App.jsx` toggles between `UserApp` and `AdminApp`. No browser history management.

---

## 6. State Management Architecture

### 6.1 AppContext (`src/context/AppContext.jsx`)

**State Tree:**
```javascript
{
  complaints: [],           // From Supabase or localStorage
  departments: [],         // Reference data (localStorage)
  officers: [],             // Reference data (localStorage)
  emergencies: [],          // Reference data (localStorage)
  aiLogs: [],              // Query history (localStorage)
  notifications: [],        // System alerts (localStorage)
  settings: {
    darkMode: false,
    animations: true,
    supabaseUrl: '',
    supabaseKey: '',
    llmApiKey: '',          // Groq/OpenAI key
    llmModel: 'gpt-4o-mini',
    llmBaseUrl: 'https://api.openai.com/v1',
    llmEnabled: true,
    llmThreshold: 40        // Confidence threshold (%)
  },
  supabaseConnected: false,
  supConnectionLog: []
}
```

### 6.2 Persistence Strategy

| Data | Storage | Sync |
|---|---|---|
| Complaints | Supabase (primary) + localStorage (fallback) | Realtime subscription + CustomEvent |
| Departments, Officers | localStorage | Version-bumped init |
| AI Logs | localStorage | Event-driven |
| Notifications | localStorage | Event-driven |
| Settings | localStorage | Immediate write |

### 6.3 Cross-Device Sync

**Supabase Realtime:** `postgres_changes` subscription on `complaints` table. Any INSERT/UPDATE triggers `reloadState()` across all connected clients.

**Cross-Tab Sync:** `CustomEvent('tvk_db_update')` + `localStorage` storage events for same-browser multi-tab.

---

## 7. Data Models

### 7.1 Complaint (Supabase Table: `complaints`)

```sql
CREATE TABLE complaints (
  id          TEXT PRIMARY KEY,        -- AI-TN-{counter}
  title       TEXT NOT NULL,
  dept        TEXT NOT NULL,         -- Department name
  status      TEXT NOT NULL DEFAULT 'New',
  sev         TEXT NOT NULL DEFAULT 'Medium',
  date        TEXT NOT NULL,          -- ISO date
  description TEXT,                  -- User's description
  location    TEXT,                  -- Human-readable address
  officer     TEXT,                  -- Assigned officer name
  ph          TEXT,                  -- Officer phone
  photo       TEXT,                  -- Base64 data URL
  created_at  TIMESTAMP DEFAULT now()
);
```

**Status Lifecycle:** `New` → `In Progress` → `Resolved` | `Escalated`

### 7.2 Department (Reference)

```javascript
{ id: 1, name: 'Municipal Corporation', icon: 'city', complaints: 245, officers: 28, resolveRate: 76 }
```

### 7.3 Officer (Reference)

```javascript
{ name: 'Raj Kumar', id: 'TN-OFF-1042', dept: 'Municipal Corporation', cases: 23, status: 'Active', joined: '2021-04-12' }
```

### 7.4 Notification

```javascript
{ icon: 'clipboard', iconClass: 'blue', title: 'New Complaint Registered', body: '...', time: 'Just now', unread: true }
```

---

## 8. AI / NLP Architecture

### 8.1 Hybrid Routing Pipeline (`src/utils/nlpRouting.js`)

```
User Input
    ↓
[detectDepartment()] — Keyword matching (200+ keywords across 17 departments)
    ↓
Confidence >= threshold (default 40%)?
    ├── YES → Return keyword result (source: 'keyword')
    └── NO  → [detectDepartmentLLM()] — Call LLM API
                  ↓
              LLM returns JSON: { deptId, reason }
                  ↓
              Return LLM result (source: 'llm')
                  ↓
              LLM fails? → Fallback to keyword result
```

### 8.2 Keyword Coverage

| Department | Key Terms |
|---|---|
| Municipal Corp | road, pothole, garbage, drainage, sewage, toilet, sanitation |
| TANGEDCO | electricity, power, transformer, voltage, pwr, elec, eb |
| CMWSSB | water, borewell, leak, pipe, tap, metro water, wtr |
| Police | theft, crime, robbery, fir, assault, stolen, cop |
| Health | hospital, medicine, doctor, clinic, vaccine, pharmacy |
| + 12 more | Full coverage in `KEYWORD_MAP` |

### 8.3 LLM Integration

**System Prompt:** Instructs model to return JSON `{ deptId, reason }` with abbreviation disambiguation rules.

**Supported Providers:** OpenAI, Groq, Fireworks, any OpenAI-compatible endpoint.

**Default Config:**
- Model: `llama-3.1-8b-instant` (Groq)
- Temperature: 0.1
- Max tokens: 80
- Response format: JSON

### 8.4 Tamil Language Support

- **Keywords:** Tamil terms mapped in `KEYWORD_MAP` (e.g., `குடிநீர்` → CMWSSB)
- **Voice Input:** `voiceLang` state toggles `en-IN` / `ta-IN` for Web Speech API
- **Quick Chips:** Tamil preset buttons in AI chat

---

## 9. API Integrations

### 9.1 Supabase (PostgreSQL + Realtime)

| Operation | Method | Table |
|---|---|---|
| Fetch complaints | `select(*).order('created_at', desc)` | complaints |
| Create complaint | `insert(row)` | complaints |
| Update complaint | `update(updates).eq('id', id)` | complaints |
| Realtime subscription | `channel('complaints-live').on('postgres_changes')` | complaints |

**RLS Policy:** `Allow all` (demo mode — no auth required).

### 9.2 OpenStreetMap Nominatim (Free)

| Endpoint | Purpose |
|---|---|
| `/reverse?lat={lat}&lon={lng}` | GPS → Human-readable address |
| `/search?q={query}&limit=5` | Place name autocomplete |

**Rate Limit:** 1 request/second (acceptable for demo).

### 9.3 Groq LLM API

| Endpoint | Purpose |
|---|---|
| `/chat/completions` | Text classification for department routing |

**Models:** `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `gemma2-9b-it`

---

## 10. Environment Variables

```bash
# Supabase (shared database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# LLM Configuration
VITE_GROQ_API_KEY=gsk_...
VITE_GROQ_BASE_URL=https://api.groq.com/openai/v1
VITE_GROQ_MODEL=llama-3.1-8b-instant
```

**Security Note:** All env vars prefixed with `VITE_` are embedded at build time. API keys are exposed to the browser. For production, use a backend proxy.

---

## 11. Component Architecture

### 11.1 UserApp (`src/views/UserApp.jsx`) — ~1400 lines

**Screen State Machine:**
```
splash → home → ai-screen → complaint → success-screen
                    ↓
              requests → schemes → emergency → notifications → profile
```

**Key Sub-Components (inline JSX):**
- `renderScreen()` — Main switch statement for screens
- `handleGPSCapture()` — Geolocation + reverse geocoding
- `searchPlaces()` — Nominatim autocomplete
- `triggerAIResponse()` — Async LLM routing
- `handleMicClick()` — Web Speech API

### 11.2 AdminApp (`src/views/AdminApp.jsx`) — ~900 lines

**Tab State:** `dashboard | departments | complaints | emergency | officers | analytics | reports | ailogs | notifications | settings`

**Key Sub-Components (inline JSX):**
- `renderActiveTab()` — Tab switch
- `handleStatusChange()` — Complaint status update
- `handleOfficerAssign()` — Officer assignment
- Toast notification system with progress bar animation

### 11.3 Reusable CSS Classes (`src/index.css`)

| Class | Purpose |
|---|---|
| `.phone-shell-container` | Mobile viewport wrapper with notch |
| `.ai-chat-hdr` | Red gradient chat header |
| `.admin-layout` | Desktop sidebar + main content layout |
| `.admin-toast` | Slide-in notification with progress bar |
| `.card` | White rounded panel with shadow |
| `.btn-primary` / `.btn-secondary` | Action buttons |
| `.badge-{status}` | Status color badges |
| `.toggle` / `.toggle.on` | Switch component |

---

## 12. Animations & Interactions

| Animation | CSS / JS | Trigger |
|---|---|---|
| Splash fade-out | CSS keyframes | 2.5s timer |
| Page transitions | CSS opacity transition | Screen change |
| Mic pulse wave | CSS `@keyframes mic-pulse` | micActive state |
| Voice listening overlay | CSS `@keyframes voicePopIn` + bar bounce | micActive state |
| Toast slide-in | CSS `@keyframes toastSlideIn` | New complaint |
| Toast progress bar | CSS `@keyframes toastProgress` | 5s countdown |
| Typing dots | CSS staggered animation | isTyping state |
| Progress bar fill | CSS `transition: width 0.6s` | Status change |
| Button press | CSS `:active { transform: scale(0.95) }` | Click |

---

## 13. Current Limitations & Technical Debt

### 13.1 Architecture

- **No backend server:** All API calls from browser expose keys
- **No authentication:** Anyone can access admin panel via URL
- **Single-file components:** UserApp.jsx and AdminApp.jsx are monolithic
- **No routing library:** Hash-based manual routing is brittle
- **No code splitting:** Single JS bundle (~300KB gzipped)

### 13.2 Data

- **localStorage notifications:** Not shared across devices even with Supabase
- **No image upload to cloud:** Photos stored as base64 strings (memory heavy)
- **No offline queue:** Supabase failures silently fall back to localStorage
- **Complaint ID collision:** `AI-TN-{1000 + count}` is not globally unique

### 13.3 AI

- **LLM exposed to client:** API key in browser bundle
- **No conversation memory:** Each chat message is independent
- **No Tamil LLM support:** LLM prompt is English-only; Tamil keywords handled offline
- **No rate limiting:** Unlimited LLM calls possible

### 13.4 Mobile

- **Voice only works on Chrome/Edge:** Safari/Firefox get fallback simulation
- **No PWA features:** No service worker, no offline support, no install prompt
- **Camera access requires HTTPS:** Mic/camera blocked on HTTP except localhost

---

## 14. Scaling Considerations for V2

### 14.1 Backend Architecture Needed

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│  Express/   │────▶│  Supabase   │
│   Frontend  │     │  Fastify    │     │  PostgreSQL │
│             │◄────│  API Layer  │◄────│             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Redis     │
                    │   (cache)   │
                    └─────────────┘
```

### 14.2 Auth System Needed

- **Citizen auth:** OTP-based mobile login (Aadhaar-linked optional)
- **Admin auth:** Role-based access control (RBAC) with JWT
- **Officer auth:** Department-scoped permissions

### 14.3 File Storage Needed

- **Supabase Storage** or **AWS S3** for evidence photos
- **CDN delivery** for fast image loading
- **Virus scanning** for uploaded files

### 14.4 Real-Time Enhancements

- **WebSockets** for bidirectional live updates (replace polling)
- **Push notifications** via Firebase Cloud Messaging
- **SMS alerts** via Twilio/Exotel for status changes

### 14.5 AI Enhancements

- **Whisper API** for Tamil speech-to-text
- **Retrieval-Augmented Generation (RAG)** for scheme knowledge base
- **Sentiment analysis** for complaint priority scoring
- **Multi-turn conversation memory** in chatbot

### 14.6 Monitoring

- **Error tracking:** Sentry or LogRocket
- **Analytics:** Mixpanel or Amplitude for user journeys
- **Uptime monitoring:** UptimeRobot or Pingdom

---

## 15. Deployment

### Current Pipeline

1. Developer commits to `main` branch
2. GitHub webhook triggers Vercel build
3. Vercel builds with env vars from project settings
4. Static site deployed to CDN edge nodes

### Required Vercel Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GROQ_API_KEY=
VITE_GROQ_BASE_URL=https://api.groq.com/openai/v1
VITE_GROQ_MODEL=llama-3.1-8b-instant
```

---

## 16. Testing Strategy

### Current (Manual)

- Browser console: `window.testRouting()` — Keyword-only test suite
- Browser console: `await window.testRoutingLLM(apiKey)` — Full LLM test
- `window.resetDB()` — Clear local data

### Needed for Production

- **Unit tests:** Jest + React Testing Library for components
- **Integration tests:** Cypress or Playwright for E2E complaint flow
- **API tests:** Postman/Newman for Supabase endpoints
- **Load tests:** k6 or Artillery for concurrent complaint filing

---

## 17. Security Checklist (Current State)

| Concern | Status | Mitigation Needed |
|---|---|---|
| API keys in frontend | ⚠️ | Move to backend proxy |
| No user authentication | ❌ | Implement JWT + OTP |
| SQL injection | ✅ | Supabase client handles parameterized queries |
| XSS | ⚠️ | React escapes by default; audit innerHTML |
| No HTTPS enforcement | ⚠️ | Vercel provides HTTPS by default |
| No rate limiting | ❌ | Backend API gateway needed |
| Base64 images in DB | ⚠️ | Move to object storage |

---

## 18. Performance Metrics (Current)

| Metric | Value |
|---|---|
| Build time | ~450ms |
| Bundle size (JS) | ~300KB gzipped |
| Bundle size (CSS) | ~5.5KB gzipped |
| First Contentful Paint | < 1s (localhost) |
| Keyword routing latency | < 10ms |
| LLM routing latency | ~300-800ms (Groq) |
| Supabase query latency | ~50-150ms |
| Realtime sync latency | < 100ms |

---

## 19. Glossary

| Term | Meaning |
|---|---|
| **TANGEDCO** | Tamil Nadu Generation and Distribution Corporation (Electricity) |
| **CMWSSB** | Chennai Metropolitan Water Supply and Sewerage Board |
| **NLP** | Natural Language Processing |
| **LLM** | Large Language Model |
| **Nominatim** | OpenStreetMap's geocoding service |
| **RLS** | Row Level Security (Supabase) |
| **RAG** | Retrieval-Augmented Generation |
| **PWA** | Progressive Web App |

---

## 20. Appendix: File References

| File | Lines | Purpose |
|---|---|---|
| `src/App.jsx` | ~30 | Root component, hash routing |
| `src/context/AppContext.jsx` | ~200 | Global state, Supabase realtime |
| `src/views/UserApp.jsx` | ~1450 | Citizen mobile app |
| `src/views/AdminApp.jsx` | ~900 | Admin desktop dashboard |
| `src/utils/db.js` | ~230 | Data layer (Supabase + localStorage) |
| `src/utils/nlpRouting.js` | ~360 | AI department detection |
| `src/utils/supabase.js` | ~10 | Supabase client |
| `src/index.css` | ~1800 | Global styles, animations |

---

*Document generated: 2026-06-05*
*App version: V1 (MVP with Supabase integration)*
*Next milestone: V2 — Backend API, Auth, PWA, Production Scale*
