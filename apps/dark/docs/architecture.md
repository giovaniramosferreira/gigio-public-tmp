# DarkTube OS — Architecture Document

Version: 1.0 | Status: Draft | Owner: Giovani Ramos Ferreira

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js 20 LTS | Long-term support; stable native fetch; good FFmpeg wrapper support |
| Framework | Next.js 14 (App Router) | Server actions + API routes for all backend logic |
| Language | TypeScript (strict) | `"strict": true` throughout; no `any` except at provider boundaries |
| UI | Tailwind CSS + shadcn/ui | Component library on Tailwind; dark theme default |
| ORM | Prisma | Schema-first; supports SQLite in V1, PostgreSQL in V2 with minimal changes |
| Database | SQLite via better-sqlite3 | Single file, zero config, gitignored under `/data/db/` |
| Job Queue | p-queue (in-process) | In-process async queue; upgradeable to BullMQ + Redis in V2 |
| Media Processing | FFmpeg via fluent-ffmpeg | Host-installed FFmpeg; checked at startup |
| Primary LLM | Claude Sonnet (claude-sonnet-4-6) | All reasoning, ideation, scripting, criticism |
| Primary TTS | ElevenLabs | English editorial narration; configurable voice profile |
| Primary Image Gen | fal.ai (configurable) | Replicate or Stability AI swappable via provider adapter |

---

## Architecture Pattern

DarkTube OS is a modular monolith. A single Next.js process handles the UI, API layer, business logic services, and background job execution. There is no separate backend server, message broker, or worker process in V1.

Long-running jobs (voice render, image generation, video assembly) are dispatched to a `p-queue` instance that manages concurrency and prevents simultaneous API floods. Job state is persisted to the SQLite `JobRun` table so the UI can poll for status and jobs survive page refreshes. The operator-facing UI polls job status via lightweight API routes at a configurable interval (default 2 seconds while a job is active).

This pattern trades distributed-system complexity for operational simplicity appropriate to a solo-operator local tool. When throughput requirements grow or multi-machine deployment is needed, the job queue layer and service interfaces are designed so that BullMQ can replace p-queue with contained changes.

---

## Module Map

The following 16 modules constitute the DarkTube OS service layer. Each module is a TypeScript module under `server/services/` unless noted. Modules communicate through typed function calls, not HTTP.

### 1. Channel Config Service (`channelConfigService`)

Manages the channel's persistent configuration: editorial pillars with descriptions and content rules, provider API keys (stored encrypted at rest), voice profile JSON, originality threshold, and scheduling preferences. Exposes read/write methods used by the Settings UI and referenced by all other services at job start. Validates provider keys on write by making a lightweight ping to each provider's API.

### 2. Discovery Service (`discoveryService`)

Implements Workflow 1: Idea Discovery. Accepts a pillar ID and optional seed text. Constructs the discovery prompt from the `/prompts/discovery/discovery-v1.md` template, injecting pillar description, content rules, and seed text. Sends to Claude and parses the structured JSON response. Scores each candidate using the Idea Scoring module. Persists candidates to the `Idea` table. Returns the ranked list to the API layer.

### 3. Idea Scoring Module (`ideaScoringModule`)

A utility module used by the Discovery Service. Computes a composite score for each idea candidate based on three dimensions: novelty estimate (derived from Claude's novelty note in the generation response), pillar fit (keyword overlap between idea and pillar description), and hook strength estimate (based on hook type classification against historical CTR data if available, or static heuristic weights if not). Returns a score from 0.0 to 1.0 with per-dimension breakdown.

### 4. Script Service (`scriptService`)

Implements Workflow 2: Script Generation. Accepts an approved idea ID. Constructs the script prompt from `/prompts/script/script-v1.md`. Sends to Claude and parses the structured response into thesis, hook variants array, narration text, beat plan, and visual direction notes. Persists the generated script to the `Script` table with status DRAFT. Triggers the Critic Service and Originality Service in sequence. Updates script status based on results.

### 5. Critic Service (`criticService`)

Evaluates any script against quality criteria defined in `/prompts/critic/critic-v1.md`. Sends the script and evaluation criteria to Claude. Parses the structured critic response: overall verdict (PASS/FAIL), per-criterion scores (hook strength, thesis clarity, factual tone, editorial originality, monetization safety), and rewrite instructions if failing. Stores the critic evaluation in the `CriticEval` table linked to the script version. Returns the verdict to the Script Service for flow control.

### 6. Originality Guard (`originalityGuard`)

Compares a candidate script against all historically approved scripts stored in the `Script` table. In V1, uses Jaccard coefficient on character trigrams as the similarity measure. Configurable threshold (default 0.75) stored in channel config. If similarity exceeds threshold, returns the matching script ID and excerpt alongside the score. The Script Service uses this to trigger rewrite or set NEEDS_HUMAN_REVIEW status. Designed so that an embedding-based comparator can replace the heuristic comparator in V1.5 by implementing the same `SimilarityComparator` interface.

### 7. Asset Direction Service (`assetDirectionService`)

Takes an approved script and generates a structured visual asset plan using Claude and the `/prompts/visual/asset-direction-v1.md` template. Output includes: per-scene background image generation prompts (formatted for SDXL), B-roll direction notes, a color palette (hex values), and three thumbnail concept descriptions with suggested text overlays. Persists the asset plan to the `AssetPlan` table. Passes image prompts to the Provider Adapter Layer for generation.

### 8. Voice Service (`voiceService`)

Sends the narration script to ElevenLabs using the configured voice profile (rate, stability, style, similarity boost, voice ID). Handles character-limit chunking by splitting at sentence boundaries before sending and concatenating audio segments after receiving. Saves the rendered audio as an MP3 file to `/data/assets/{script-id}/voice.mp3`. Stores the file path in the `Asset` table. Implements retry with exponential backoff for API failures.

### 9. Caption Service (`captionService`)

Generates timed captions from the script text and audio file. Reads the audio duration from the rendered MP3 metadata. Distributes caption timing proportionally across sentences and clauses. Produces a burned-in caption overlay specification (text, start time, end time, position, style) and an SRT file. Stores both in the `Asset` table. Caption style parameters (font, size, position, color) are read from channel config.

### 10. Video Assembly Service (`videoAssemblyService`)

Uses `fluent-ffmpeg` to composite the production package into a 1080x1920 MP4 (9:16 aspect ratio). Assembly sequence: (1) background image slideshow with crossfade transitions keyed to beat plan timing, (2) voice audio track, (3) burned-in caption overlay, (4) optional ambient audio mixed at configured volume. FFmpeg stderr is captured and stored with the job run for debugging. Output written to `/data/renders/{script-id}/preview.mp4`. File path stored in the `VideoRender` table.

### 11. Thumbnail Generator (`thumbnailGenerator`)

Takes the three thumbnail concept descriptions from the asset plan and sends each as an image generation prompt to the configured image provider via the Provider Adapter Layer. Generates three variants, each at 1280x720 (YouTube thumbnail spec). Scores each variant using the local readability heuristic (contrast ratio between detected text region and background, text density percentage). Stores all three variants and their scores in `/data/assets/{script-id}/thumbnails/`. Best-scoring variant is flagged.

### 12. QA Service (`qaService`)

Evaluates the assembled production package against a checklist before unlocking the export action. Checks: (1) preview MP4 exists and is a valid video file, (2) audio peak levels within acceptable range (-3dBFS to -6dBFS), (3) captions are present and have at least one timed entry, (4) at least one thumbnail variant exists, (5) all file sizes within expected bounds (video > 500KB, audio > 50KB), (6) no asset flagged as FAILED in the `Asset` table. Returns a structured QA report with per-criterion pass/fail. Sets the `VideoPackage` status to QA_PASSED or QA_FAILED.

### 13. Package Export Service (`packageExportService`)

Takes a QA-passed video package and writes the export directory to `/data/exports/{video-slug}/`. Contents: `preview.mp4` (the assembled video), `thumbnail-1.jpg`, `thumbnail-2.jpg`, `thumbnail-3.jpg` (all three variants), `metadata.json` (title, description, tags, recommended hashtags, video slug), `script.txt` (plain text narration), and `captions.srt` (sidecar captions). Export is atomic: the directory is written to a temp path and renamed on completion. Partial exports are cleaned up on failure. Records the export event in the `Export` table.

### 14. Analytics Service (`analyticsService`)

Handles analytics ingestion and dashboard data computation. Accepts YouTube Studio CSV format or manual metric entry (views, watch time percentage, CTR, likes, date). Parses, deduplicates, and stores in `AnalyticsEntry` table keyed by video slug and date. Computes dashboard aggregations: pillar performance rankings (average CTR by pillar), hook archetype performance (average CTR by hook type classification), and underperforming pattern detection. Generates the weekly digest narrative using Claude with the analytics data as context. Stores digest in `AnalyticsDigest` table.

### 15. Job Orchestrator (`jobOrchestrator`)

The central coordination layer for all multi-step pipeline jobs. Accepts a pipeline type and entity ID, creates a `JobRun` record in SQLite with status QUEUED, and enqueues the appropriate sequence of service calls in p-queue. Updates `JobRun` status to RUNNING, then to COMPLETED or FAILED. On failure, stores the error message and step name in the `JobRun` record. Exposes a `getStatus(jobRunId)` method used by the polling API route. Handles step-level retry by re-enqueuing failed individual steps up to the configured retry limit.

### 16. Provider Adapter Layer (`providers/`)

A set of adapter modules that implement the `ProviderAdapter` interface: `generate(input: ProviderInput, options: ProviderOptions): Promise<Result>`. Adapters exist for: Claude (LLM), ElevenLabs (TTS), fal.ai (image generation), and Replicate (image generation, alternative). The active provider for each category is selected from channel config. No provider-specific logic appears above the adapter layer. All adapters implement retry with exponential backoff (3 attempts, base delay 1 second, multiplier 2). Provider errors are wrapped in a typed `ProviderError` before propagation.

---

## Architecture Diagram

```mermaid
graph TD
    UI[Next.js GUI] --> API[API Routes / Server Actions]
    API --> ChannelSvc[Channel Config Service]
    API --> DiscoverySvc[Discovery Service]
    API --> ScriptSvc[Script Service]
    API --> CriticSvc[Critic & Originality Service]
    API --> AssetSvc[Asset Direction Service]
    API --> VoiceSvc[Voice Service]
    API --> CaptionSvc[Caption Service]
    API --> VideoSvc[Video Assembly Service]
    API --> QASvc[QA Service]
    API --> ExportSvc[Package Export Service]
    API --> AnalyticsSvc[Analytics Service]
    API --> JobOrch[Job Orchestrator]
    JobOrch --> Queue[p-queue]
    Queue --> DiscoverySvc
    Queue --> ScriptSvc
    Queue --> VoiceSvc
    Queue --> VideoSvc
    DiscoverySvc --> Providers[Provider Adapter Layer]
    ScriptSvc --> Providers
    CriticSvc --> Providers
    AssetSvc --> Providers
    VoiceSvc --> Providers
    Providers --> Claude[Claude API]
    Providers --> ElevenLabs[ElevenLabs API]
    Providers --> ImageGen[Image Gen API]
    API --> DB[(SQLite / Prisma)]
    VideoSvc --> Storage[/data/ filesystem]
    ExportSvc --> Storage
```

---

## Data Flow

The following describes the end-to-end data flow from idea discovery to export package.

**Step 1 — Configuration.** On first run, the operator opens Settings and configures channel name, editorial pillars, provider API keys, voice profile, and originality threshold. Channel Config Service persists all settings to the `ChannelConfig` table in SQLite. Provider keys are validated on save.

**Step 2 — Idea Discovery.** The operator selects a pillar and optionally enters seed notes. The API route calls the Discovery Service, which constructs a prompt from the discovery template, sends it to Claude via the Provider Adapter Layer, and parses the structured JSON response. Idea candidates are persisted to the `Idea` table with scores. The ranked list is returned to the UI.

**Step 3 — Idea Selection.** The operator selects an idea. The `Idea` record is updated to status SELECTED. The UI navigates to the Script Workspace and triggers script generation.

**Step 4 — Script Generation.** The Job Orchestrator creates a `JobRun` record (QUEUED) and enqueues the script generation pipeline. The Script Service constructs the script prompt, calls Claude, parses the response, and persists a `Script` record (DRAFT). The Critic Service evaluates the script and persists a `CriticEval` record. If the critic fails, the Script Service rewrites (up to 3 times). The Originality Guard compares against `Script` history and stores the similarity score. If all checks pass, the script is set to APPROVED_FOR_PRODUCTION.

**Step 5 — Production Pipeline.** The operator triggers production from the Script Workspace. The Job Orchestrator enqueues the production pipeline steps in sequence:
- Asset Direction Service calls Claude to generate the asset plan; persists `AssetPlan`
- Voice Service calls ElevenLabs, saves `voice.mp3` to `/data/assets/`, persists `Asset` record
- Caption Service generates timed captions from script + audio duration, saves SRT file, persists `Asset` record
- Video Assembly Service invokes FFmpeg, saves `preview.mp4` to `/data/renders/`, persists `VideoRender` record
- Thumbnail Generator calls the image provider three times, saves JPGs to `/data/assets/thumbnails/`, persists `Asset` records
- QA Service evaluates the complete package, persists `QAReport`, sets `VideoPackage` status

At each step, the `JobRun` record is updated with current step name and status. The UI polls the `/api/jobs/[id]/status` route every 2 seconds.

**Step 6 — Review.** The operator opens the Review screen. The UI loads the `VideoPackage` with its linked `Script`, `VideoRender`, `Asset` records, and `QAReport`. The operator watches the preview video, reviews thumbnails and captions, and either approves or rejects.

**Step 7 — Export.** On approval, the Export Service reads all assets from the database by file path, writes the export directory to a temp path under `/data/exports/`, and renames atomically on success. An `Export` record is persisted with the export path and timestamp. The operator copies the metadata.json title and description, opens YouTube Studio, and uploads manually.

**Step 8 — Analytics Ingestion.** After the video is live and has initial data, the operator imports a YouTube Studio CSV or enters metrics manually. The Analytics Service parses the data, deduplicates against existing records, and updates aggregations. The dashboard reflects updated pillar and hook performance rankings.

---

## Directory Structure

```
/
├── app/                    # Next.js App Router pages and layouts
│   ├── (dashboard)/        # Dashboard page with weekly digest and KPIs
│   ├── ideas/              # Idea discovery, scoring, and selection
│   ├── scripts/            # Script review workspace with critic notes
│   ├── production/         # Production job monitor with step-level progress
│   ├── review/             # Preview player, QA report, and approval screen
│   ├── export/             # Export package status and file listing
│   ├── analytics/          # Analytics dashboard and import screen
│   └── settings/           # Channel config, provider keys, voice profile
├── components/             # Shared UI components (cards, tables, player, status badges)
├── lib/                    # Shared utilities
│   ├── logger.ts           # Structured JSON logger
│   ├── config.ts           # Env var validation and typed config object
│   ├── storage.ts          # File system path helpers and write utilities
│   └── errors.ts           # Typed error classes (ProviderError, ValidationError, etc.)
├── server/
│   ├── services/           # Business logic services (one file per module)
│   ├── repositories/       # Prisma data access layer (one file per entity)
│   └── jobs/               # Job handler functions called by Job Orchestrator
├── providers/              # Provider adapter implementations
│   ├── claude.ts           # Claude adapter (Anthropic SDK)
│   ├── elevenlabs.ts       # ElevenLabs adapter
│   ├── falai.ts            # fal.ai adapter
│   ├── replicate.ts        # Replicate adapter (alternative)
│   └── types.ts            # ProviderAdapter interface and shared types
├── prompts/                # Prompt templates by pipeline stage
│   ├── discovery/
│   │   └── discovery-v1.md
│   ├── script/
│   │   └── script-v1.md
│   ├── critic/
│   │   └── critic-v1.md
│   ├── visual/
│   │   └── asset-direction-v1.md
│   ├── title/
│   │   └── title-v1.md
│   └── qa/
│       └── qa-narrative-v1.md
├── prisma/
│   ├── schema.prisma       # Prisma schema (SQLite provider)
│   └── migrations/         # Auto-generated migration files
├── docs/                   # Project documentation
│   ├── prd.md
│   └── architecture.md
├── data/                   # Runtime data directory (gitignored)
│   ├── db/                 # SQLite database file
│   ├── assets/             # Generated audio, images, thumbnails (per script ID)
│   ├── renders/            # Assembled preview MP4 files (per script ID)
│   ├── exports/            # Final export packages (per video slug)
│   ├── logs/               # Structured JSON log files (daily rotation)
│   └── cache/              # Provider response cache for development (optional)
└── public/                 # Static assets for the Next.js UI
```

---

## Background Job Strategy

### Queue Configuration

p-queue is instantiated in `server/jobs/queue.ts` as a module-level singleton. Separate queue instances are created for LLM jobs (concurrency 2), TTS jobs (concurrency 1), image generation jobs (concurrency 2), and video assembly jobs (concurrency 1). This prevents simultaneous FFmpeg processes and respects provider rate limits.

### Job State Persistence

Every job run is represented by a `JobRun` record in SQLite with the following fields: `id`, `pipelineType` (DISCOVERY, SCRIPT, PRODUCTION, EXPORT), `entityId` (the ID of the Idea, Script, or VideoPackage being processed), `status` (QUEUED, RUNNING, COMPLETED, FAILED, NEEDS_HUMAN_REVIEW), `currentStep` (the name of the step currently executing), `error` (error message if FAILED), `createdAt`, `startedAt`, `completedAt`. Job state is written synchronously to SQLite at each step transition using Prisma.

### UI Polling

When the UI needs job status, it polls `GET /api/jobs/[id]/status` every 2 seconds while the job is in QUEUED or RUNNING status. The polling interval increases to 5 seconds after 60 seconds of activity. Polling stops when the job reaches COMPLETED, FAILED, or NEEDS_HUMAN_REVIEW. The API route reads the `JobRun` record and returns status, currentStep, and error. No WebSocket or SSE is used in V1.

### Error Handling

If a job step throws an error, the Job Orchestrator catches it, updates the `JobRun` record to FAILED with the error message and step name, and stops the pipeline. The operator sees the failure in the Production UI with the step name and error. A "Retry step" button re-enqueues only the failed step and resumes from that point. If the error is a `ProviderError` from the adapter layer, the retry logic in the adapter has already exhausted its retries before the error reaches the orchestrator.

---

## Storage Strategy

All generated media files are stored under `/data/` relative to the project root. This directory is gitignored and documented in `.gitignore` and `.env.example`.

**Path conventions:**
- Voice audio: `/data/assets/{scriptId}/voice.mp3`
- Background images: `/data/assets/{scriptId}/bg-{sceneIndex}.jpg`
- Thumbnails: `/data/assets/{scriptId}/thumbnails/thumb-{variant}.jpg`
- Caption SRT: `/data/assets/{scriptId}/captions.srt`
- Preview render: `/data/renders/{scriptId}/preview.mp4`
- Export package: `/data/exports/{videoSlug}/`

File paths are stored in the database as relative strings from the project root (e.g., `data/assets/abc123/voice.mp3`). The `storage.ts` utility resolves them to absolute paths using `process.cwd()` at access time. This allows the project root to be moved without database migration.

Media files are named by entity ID (script ID or video slug) plus type plus variant index. Timestamps are not used in filenames; they exist in the database record. This keeps filenames stable and predictable for the export package.

---

## Failure Strategy

### Provider Failures

All provider adapters implement retry with exponential backoff: 3 attempts maximum, base delay 1 second, multiplier 2 (delays: 1s, 2s, 4s). If all retries fail, the adapter throws a `ProviderError` with provider name, HTTP status code if applicable, and the original error message. The Job Orchestrator catches `ProviderError`, marks the job FAILED, and stores the error details in `JobRun.error`. The operator can inspect the error in the Production UI and retry the step manually.

### FFmpeg Failures

`fluent-ffmpeg` exposes an `on('error')` event and captures stderr. The Video Assembly Service attaches stderr capture to every FFmpeg invocation. On error, the full stderr output is stored in the `JobRun.error` field (truncated to 10,000 characters). FFmpeg is also checked at application startup: the `startup.ts` module runs `ffmpeg -version` during `next.config.js` initialization and logs a WARN with a remediation message if FFmpeg is not available. Media generation routes return an error response if the startup check failed.

### Database Write Failures

Prisma throws on write failure. These errors are not caught silently anywhere in the codebase. The pattern is: let the error propagate to the nearest async boundary, log it at ERROR level with the operation name and entity ID, and return a typed error response to the API caller. The UI surfaces database errors as dismissible error banners with the message text. No silent data loss.

### Missing or Corrupted Assets

The QA Service validates asset presence and basic integrity (file exists, file size above minimum threshold, video file is parseable) before marking a package as QA_PASSED. A package with any missing or corrupted asset is marked QA_FAILED with the specific failing criteria identified. The export action is disabled for QA_FAILED packages. The operator can re-trigger specific production steps (re-render voice, regenerate thumbnails) from the Production UI to replace failed assets without restarting the full pipeline.

### Partial Export Cleanup

The Package Export Service writes to a temp directory (`/data/exports/.tmp-{videoSlug}-{timestamp}/`) and renames to the final path only after all files are written successfully. If any write fails, the temp directory is deleted and the export is marked FAILED. The operator can re-trigger export from the Review screen after inspecting the error.
