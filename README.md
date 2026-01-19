# LeadDrip

A production-grade B2B lead intelligence platform that discovers high-intent prospects using custom buying signals and automated research on public web sources.

## Features

- **Hunt Mode**: Discover net-new accounts daily using your ICP + custom signals
- **Watch Mode**: Monitor specific company domains for new signals
- **Evidence-Backed**: Every signal match includes URL, snippet, timestamp, and source type
- **Anti-Hallucination**: Strict retrieval-backed LLM pipeline prevents fabricated data
- **LinkedIn Integration**: Generate search URLs and queries for finding contacts

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL via Supabase (with Row Level Security)
- **LLM Providers**: OpenAI or Anthropic (configurable)
- **Search Providers**: Tavily, SerpAPI, or Bing (configurable)
- **Background Jobs**: Vercel Cron

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (or local Supabase)
- API keys for LLM and Search providers

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd leaddrip

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables (see below)

# Run database migrations
# (Apply supabase/migrations/001_initial_schema.sql to your Supabase instance)

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM Provider (choose one)
LLM_PROVIDER=openai  # or "anthropic"
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Search Provider (choose one)
SEARCH_PROVIDER=tavily  # or "serpapi" or "bing"
TAVILY_API_KEY=your_tavily_api_key
SERPAPI_KEY=your_serpapi_key
BING_SEARCH_KEY=your_bing_search_key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_cron_secret

# Demo Mode (auto-enabled if API keys missing)
DEMO_MODE=false
```

## Demo Mode

If API keys are not configured, LeadDrip runs in Demo Mode with:
- Sample fixture data showing the full UI/UX
- Mock lead generation responses
- All features available for exploration

## Project Structure

```
leaddrip/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login/signup)
│   │   ├── (dashboard)/        # Main app pages
│   │   │   ├── drip/           # Today's leads view
│   │   │   ├── signals/        # Signals studio
│   │   │   ├── lists/          # Lists & watch manager
│   │   │   ├── settings/       # App settings
│   │   │   └── onboarding/     # Setup wizard
│   │   └── api/                # API routes
│   │       ├── leads/          # Lead CRUD
│   │       ├── config/         # User config
│   │       ├── cron/           # Daily job
│   │       ├── watch/          # Watch lists
│   │       └── signals/        # Signal testing
│   │
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── layout/             # Layout components
│   │   ├── leads/              # Lead-specific components
│   │   ├── signals/            # Signal components
│   │   └── onboarding/         # Onboarding components
│   │
│   └── lib/
│       ├── providers/
│       │   ├── llm/            # LLM abstraction (OpenAI/Anthropic)
│       │   └── search/         # Search abstraction (Tavily/SerpAPI/Bing)
│       ├── pipeline/           # Lead generation pipeline
│       │   ├── query-planner   # Search query planning
│       │   ├── retrieval       # Search execution
│       │   ├── candidate-extractor
│       │   ├── evidence-fetcher
│       │   ├── signal-evaluator
│       │   ├── scorer          # Lead scoring & gating
│       │   └── lead-generator  # Final lead assembly
│       ├── schemas/            # Zod schemas
│       ├── db/                 # Supabase client & queries
│       ├── fixtures/           # Demo data
│       └── utils/              # Utility functions
│
├── supabase/
│   └── migrations/             # Database migrations
│
└── tests/                      # Test files
```

## Pipeline Architecture

The lead generation pipeline follows a strict retrieval-backed approach:

1. **Query Planner**: LLM generates 20-40 search queries based on ICP and signals
2. **Retrieval**: Execute queries via search provider, deduplicate results
3. **Candidate Extractor**: LLM extracts company domains from search results
4. **Evidence Fetcher**: Fetch and parse web pages for evidence chunks
5. **Signal Evaluator**: LLM evaluates each signal with strict evidence requirements
6. **Scorer**: Calculate scores, apply evidence gate, select top leads
7. **Lead Generator**: Create final lead records with narratives and openers

### Evidence Gate Rules

Leads must pass the evidence gate to be included:
- At least 2 evidence URLs, OR 1 primary source (company site, job post, press release, SEC filing)
- At least 1 high-priority signal OR 2 medium-priority signals
- No disqualifier signals triggered

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/leads` | GET | Fetch leads with filters |
| `/api/leads/generate` | POST | Trigger lead generation |
| `/api/leads/:id` | PATCH | Update lead status |
| `/api/config` | GET/PUT/PATCH | User configuration |
| `/api/cron/daily` | POST/GET | Vercel cron endpoint |
| `/api/watch` | GET/POST | Watch list management |
| `/api/watch/import` | POST | Import domains to watch list |
| `/api/signals/test` | POST | Test a signal definition |

## Vercel Deployment

### Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/daily",
    "schedule": "0 8 * * *"
  }]
}
```

Set `CRON_SECRET` in your Vercel environment and configure the cron to include the authorization header.

### Environment Setup

1. Create a Vercel project
2. Add all environment variables from `.env.example`
3. Deploy

## Design System

LeadDrip uses a "sleek, nocturnal, signal-radar" design language:

- **Colors**: Deep charcoal background (#0f0f11), off-white text, electric cyan accent (#00d9ff)
- **Typography**: Modern grotesk for UI, monospace for evidence/code
- **Components**:
  - Signal chips (priority-coded badges)
  - Proof cards (evidence with source tags)
  - Score pills (0-100 with color coding)
  - Why-now callouts (highlighted evidence summaries)

## Signals System

Signals are structured as yes/no questions about accounts:

```typescript
interface SignalDefinition {
  id: string;
  name: string;
  question: string;  // "Does {account} show signs of...?"
  category: SignalCategory;
  priority: "low" | "medium" | "high";
  weight: number;  // 0-10
  queryTemplates: string[];  // Search keywords
  acceptedSources: EvidenceSourceType[];
  isDisqualifier: boolean;
  enabled: boolean;
}
```

### Signal Categories

- Funding & Corporate Actions
- Leadership/Org Changes
- Product/Strategy
- Hiring/Team
- Market Expansion/Partnerships
- Technology Adoption
- Risk/Compliance
- Disqualifiers (negative signals)

## Anti-Hallucination Rules

The system enforces strict evidence requirements:

1. Signal matches MUST have explicit evidence support
2. Uncertain signals are marked "unknown" (not counted)
3. Person names ONLY from evidence (otherwise LinkedIn search URL)
4. Numbers (funding, headcount) ONLY from evidence snippets
5. Every "why now" sentence cites evidence URLs

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## License

Proprietary - All rights reserved.
