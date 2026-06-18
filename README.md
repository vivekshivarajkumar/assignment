# CareerCrafter AI — FuturePath Careers Pilot

Generative AI career acceleration copilot built for **Caselet 2** (6MBP302 Generative AI Product Management).

## Product Features

| Feature | Spec alignment |
|---------|----------------|
| **Job Requirement Fetcher** | URL scrape + Gemini structured extraction (must-have/nice-to-have skills, seniority, domain) |
| **Resume Intelligence Parser** | Candidate profile graph with skills, evidence, seniority, candidate type |
| **Fit Scoring Engine** | Weighted formula: 30% relatedness + 25% preparedness + 20% evidence + 10% ATS + 10% seniority + 5% domain |
| **Authenticity Guardrail** | Blocks tailoring when relatedness &lt; 35, evidence &lt; 30%, must-have &lt; 25%, or seniority gap &gt; 2 levels |
| **Ethical Resume Customizer** | Truth-only rewriting via Gemini Flash |
| **Cover Letter Generator** | Role-specific, candidate-type aware |
| **Skill Development Path** | 12-week milestone plan from gaps |
| **Networking Message Drafter** | Recruiter, hiring manager, alumni, referral contexts |
| **Adaptive Mock Interview** | Multi-turn Q&A with coach feedback |
| **Role Insights** | Interview questions, FAQs, pay scale from web |

## Stack

- Next.js 16 · SQLite (Drizzle) · Gemini Flash (primary) · OpenAI (fallback)

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY (recommended)

npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Recommended | Gemini Flash for all generative features |
| `GEMINI_CHAT_MODEL` | No | Default: `gemini-2.5-flash` |
| `OPENAI_API_KEY` | Fallback | Used if Gemini unavailable |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/resume/upload` | Parse resume + profile graph + match jobs |
| GET | `/api/jobs` | List jobs with fit scores |
| POST | `/api/jobs/add-link` | Fetch & structure job from URL |
| GET | `/api/jobs/[id]/fit` | Full fit breakdown |
| POST | `/api/jobs/[id]/tailor` | Ethical resume customize (guardrailed) |
| POST | `/api/jobs/[id]/cover-letter` | Generate cover letter |
| POST | `/api/jobs/[id]/skill-path` | Skill development path |
| POST | `/api/jobs/[id]/networking` | Outreach message draft |
| POST | `/api/jobs/[id]/mock-interview` | Adaptive mock interview |
| GET | `/api/jobs/[id]/insights` | Interview Q&A & pay data |

## Pilot Metrics (Target)

- Application Success Rate ↑ from 15% baseline
- User Confidence Score ↑ from 6/10
- Coach turnaround ↓ from 48 hours
- High authenticity & fairness scores
