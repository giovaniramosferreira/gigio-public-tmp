# DarkTube OS — Gap Analysis

Version: 1.0 | Status: Draft | Owner: Giovani Ramos Ferreira

---

## 1. Open Questions

The following questions were identified during spec review. Each is answered with a recommended default that can be overridden before implementation begins.

### Q1: Preferred local database — SQLite or PostgreSQL?

**Recommendation: SQLite**

SQLite requires no network setup, no authentication, no background daemon, and works identically on any local machine with Node.js installed. Prisma supports both engines with minimal schema changes — the only required change is the `datasource provider` field and the connection URL format. For a single-operator local production console handling at most hundreds of records, SQLite is not a compromise; it is the correct choice. Migration to PostgreSQL is a documented one-day task if the operator later moves to a hosted or shared environment.

### Q2: Preferred UI style — minimal dark console, light editorial console, or theme toggle?

**Recommendation: Dark console as default, theme toggle as V1.5 enhancement**

DarkTube OS is an operational production tool, not a marketing site or content CMS. Dark console styling reduces eye strain during extended editing sessions, matches the aesthetic expectations of a technical operator, and signals the serious, production-grade nature of the tool. A theme toggle adds UI complexity and stylesheet branching with no operational benefit in V1. Revisit if a second operator with different preferences joins.

### Q3: Analytics ingestion in V1 — manual CSV/import-friendly or API-ready stub only?

**Recommendation: Manual CSV import + API stub**

YouTube Studio Analytics API requires OAuth 2.0 with channel-owner credentials, token refresh logic, and handling for rate limits and quota. This is significant scope for V1 when the operator can export a CSV from YouTube Studio in under a minute. V1 implements a CSV import parser and a clearly documented stub interface (`AnalyticsProvider`) that a YouTube API adapter can implement in V2. Manual entry of key metrics (views, watch time, CTR) via form is also supported for one-off imports.

### Q4: Which TTS provider should be primary?

**Recommendation: ElevenLabs**

ElevenLabs produces the highest natural English voice quality for editorial narration in the 30-50 second range required by Shorts format. The API is well-documented, supports configurable voice profiles (rate, stability, style, similarity boost), and returns audio as MP3 or PCM. The character-limit per request requires chunking for scripts above approximately 2,500 characters; this is handled in the Voice Service. Secondary adapter for OpenAI TTS is a viable fallback with lower quality ceiling but simpler pricing.

### Q5: Which image/video provider should be primary?

**Recommendation: fal.ai (configurable, with Replicate as alternative)**

fal.ai provides fast inference for SDXL and other diffusion models, supports async job polling, and has predictable per-image pricing. The Provider Adapter Layer abstracts the provider, so the operator can switch to Replicate, Stability AI, or a local ComfyUI instance by changing a config value. fal.ai is recommended as the default because its queue-based async model maps cleanly to the in-process job queue pattern used throughout the system.

### Q6: Should the app support offline drafting when providers are unavailable?

**Recommendation: Yes, with partial offline support**

Script editing, idea management, review decisions, and analytics browsing require no external providers and must work fully offline. Media generation (voice render, image generation, video assembly requiring cloud models) is blocked when the relevant provider is unreachable. The UI displays a provider status indicator on the settings page and on job launch screens. Jobs that cannot start due to provider unavailability are queued with status PENDING_PROVIDER rather than failing immediately.

### Q7: Is automatic research via web search part of MVP?

**Recommendation: LLM ideation + user-fed notes in V1; Perplexity/Tavily stub for V1.5**

Automatic web research requires API keys, rate-limit handling, result deduplication, and hallucination risk from mixing retrieved content with LLM generation. In V1, the Discovery Service uses Claude with a curated system prompt seeded by the operator's editorial pillars and optional free-text notes. The operator pastes relevant headlines or source excerpts into the idea seed field manually. A `ResearchProvider` stub interface is defined in V1 so a Perplexity or Tavily adapter can be dropped in for V1.5 without architectural changes.

---

## 2. Ambiguity List

The following ambiguities were identified in the spec. Each has a resolution note that becomes a binding implementation assumption unless overridden by the operator before build begins.

| Ambiguity | Resolution |
|---|---|
| "Premium providers" not specified by name | Resolved by Q4 and Q5 above: ElevenLabs for TTS, fal.ai for image gen, Claude Sonnet for LLM |
| Exact similarity threshold for originality guard not specified | Configurable in settings, default 0.75 cosine similarity or Jaccard coefficient depending on implementation phase |
| Caption burn-in vs sidecar not specified for V1 | Burn-in is the default for Shorts (no playback environment guarantees sidecar rendering). Sidecar SRT export is offered as an additional output |
| "Ambient music" in FR-10 not specified | Optional. User-provided royalty-free audio file uploaded via settings, or silence. No music generation in V1 |
| Analytics snapshot schedule not specified | Manual trigger is primary. Optional daily cron via Node.js `node-cron` that runs at 06:00 local time; disabled by default |
| Thumbnail readability scoring method not specified | Local heuristic in V1: contrast ratio between text and background, text density (percentage of pixels occupied by detected text region). Optional upgrade to vision model scoring in V1.5 |
| Rewrite count limit not defined | Maximum 3 automatic rewrites before the job halts with status NEEDS_HUMAN_REVIEW. Operator can manually trigger additional rewrites from the script workspace |
| Voice pace and tone config spec not defined | JSON profile stored per channel config with fields: `rate` (0.5–2.0), `stability` (0.0–1.0), `style` (0.0–1.0), `similarity_boost` (0.0–1.0), `voice_id` (ElevenLabs voice ID string) |
| "Learning loop" recommendation timing not defined | Weekly digest surfaced as a banner on the dashboard. Computed Sunday night at 23:00 local time if cron is enabled, or on manual trigger |

---

## 3. Implementation Assumptions

The following assumptions are accepted unless explicitly overridden. They define the technical baseline for all implementation work.

- **Framework:** Next.js 14 App Router with server actions and API routes
- **Language:** TypeScript in strict mode throughout (`"strict": true` in tsconfig)
- **Database:** SQLite via `better-sqlite3` accessed through Prisma ORM
- **Schema location:** `/prisma/schema.prisma`; migrations stored in `/prisma/migrations/`
- **UI components:** shadcn/ui component library on Tailwind CSS
- **Job queue:** `p-queue` (in-process, single concurrency queue per provider type). Upgradeable to BullMQ + Redis in V2 by replacing the queue layer without changing job handler signatures
- **Video processing:** FFmpeg accessed via `fluent-ffmpeg` Node.js wrapper. FFmpeg binary must be installed on the host; checked at application startup
- **Primary LLM:** Claude Sonnet 4.6 (`claude-sonnet-4-6`) via Anthropic SDK for all reasoning, ideation, scripting, and criticism tasks
- **Provider interface contract:** All provider adapters implement `generate(input: ProviderInput, options: ProviderOptions): Promise<Result>`. No provider-specific logic leaks above the adapter layer
- **Media storage:** All generated media files stored under `/data/` relative to project root. This directory is gitignored. Paths stored as relative strings in the database
- **Prompt templates:** Markdown files under `/prompts/` organized by pipeline stage. Templates use `{{variable}}` substitution. Prompts are versioned by filename (e.g., `discovery-v1.md`)
- **No Docker in V1:** Bare Node.js local run with `npm run dev` and `npm run start`. Docker Compose added in V2 if multi-service architecture is adopted
- **No background daemon:** The Next.js process handles all work including job processing. Long-running jobs use in-process async execution
- **Environment variables:** All secrets and provider keys stored in `.env.local`, never committed. A `.env.example` documents required keys without values
- **Logging:** Structured JSON logs written to `/data/logs/` via a lightweight logger wrapper. Console output in development, file output in production

---

## 4. Risk Notes

The following risks are identified with their mitigations. Each should be reviewed before the corresponding module is built.

### Prompt Drift (Highest Priority)

The highest systemic risk is gradual degradation of output quality as prompts are edited without version tracking. A prompt change that improves one output type can silently regress another. Mitigation: all prompts live in `/prompts/` as versioned `.md` files. Prompt version is logged with every job run in the `JobRun` table. The critic pass provides a second-layer quality signal that will surface regressions in output quality before they reach export.

### FFmpeg Availability

FFmpeg is not bundled with Node.js and must be installed on the host operating system. If FFmpeg is absent or not on PATH, video assembly fails silently in some configurations. Mitigation: a startup check runs `ffmpeg -version` at application boot. If it fails, the application logs an error, marks media generation features as unavailable, and surfaces an alert in the settings UI.

### ElevenLabs Character Limits

ElevenLabs API requests have a character limit per call (approximately 2,500 characters for standard tier). A 50-second script at natural speaking pace is approximately 700-900 characters, well within limits. However, if the operator generates longer scripts or adds annotations, chunking is required. Mitigation: the Voice Service splits input at sentence boundaries before sending, then concatenates audio segments. This behavior is transparent to upstream services.

### Originality Guard Accuracy

Semantic similarity detection using heuristics (Jaccard coefficient on n-grams) is less accurate than embedding-based cosine similarity. A heuristic approach may miss paraphrase-level similarity. Mitigation: heuristic comparison ships in V1 with a clearly documented upgrade path to embedding-based comparison (OpenAI `text-embedding-3-small` or a local model). The originality score is surfaced to the operator rather than used as a hard gate alone; the operator sees the score and the matched excerpt and makes the final call.

### No YouTube Upload in V1

The export package is produced for manual upload only. YouTube API upload is deferred to V2. This means the operator must manually open YouTube Studio, configure the Short, and upload the exported package. Risk: friction may reduce publishing velocity. Mitigation: the export package is structured to make manual upload as fast as possible (pre-named files, a metadata.json with title/description/tags ready to copy-paste).

### SQLite Concurrency

SQLite supports only one writer at a time. With `p-queue` managing job execution sequentially per queue, concurrent write conflicts are unlikely. However, if the operator runs multiple browser tabs or triggers overlapping jobs, write contention is possible. Mitigation: Prisma's SQLite driver handles serialization at the connection level. The job queue enforces single-job execution per queue. Concurrent read operations are unrestricted and safe.

---

## 5. SQLite vs PostgreSQL Recommendation

### Decision: SQLite for V1

SQLite is the correct database choice for DarkTube OS V1 for the following reasons:

- **Zero setup:** No installation beyond the `better-sqlite3` npm package. No network configuration, no credentials, no background service to manage
- **Portability:** The database is a single file at `/data/db/darktube.db`. Backup is a file copy. Migration between machines is a file transfer
- **Performance:** For a single-operator tool with at most thousands of rows across all tables, SQLite query performance is indistinguishable from PostgreSQL
- **Prisma support:** Prisma's SQLite provider is mature and feature-complete for the schema required by DarkTube OS. Migrations work identically to PostgreSQL
- **No operational overhead:** The operator does not need to manage connection pools, authentication, or server processes

### Migration Path to PostgreSQL

When the operator is ready to migrate (for example, to enable hosting or multi-operator access), the migration requires:

1. Change `datasource db { provider = "sqlite" }` to `provider = "postgresql"` in `schema.prisma`
2. Update `DATABASE_URL` in `.env.local` to a PostgreSQL connection string
3. Run `npx prisma migrate deploy` against the new database
4. Export SQLite data using `prisma db seed` or a custom migration script
5. Import to PostgreSQL

This is a documented one-day task. No application code changes are required if Prisma is used consistently throughout (no raw SQL with SQLite-specific syntax).
