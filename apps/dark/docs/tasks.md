# DarkTube OS — Task Breakdown
Version: 1.0

---

## Execution Phases

| Phase | Name | Scope |
|---|---|---|
| Phase 1 | Foundation | Project scaffolding, config, infrastructure primitives |
| Phase 2 | Domain and Persistence | Data model, migrations, repository layer |
| Phase 3 | Provider Adapters | LLM, TTS, image generation interfaces and implementations |
| Phase 4 | Discovery and Scripting Pipeline | Idea generation, scoring, scripting, critic, originality guard |
| Phase 5 | Media Pipeline | Asset plan, voice render, captions, FFmpeg assembly, thumbnails |
| Phase 6 | QA and Review | QA scoring, review UI, export package builder |
| Phase 7 | Analytics and Learning | Analytics ingestion, learning loop, dashboard |
| Phase 8 | Hardening and Testing | Unit, integration, E2E tests, logging, docs |

Tasks marked `[P]` are parallelizable — they have no dependency on other tasks within their phase and can be executed concurrently by multiple workers or sprints.

---

## Task List

### Phase 1 — Foundation

- [ ] T-001 [P] Initialize Next.js 14 project with TypeScript strict mode
- [ ] T-002 [P] Configure Tailwind CSS and install shadcn/ui
- [ ] T-003 [P] Set up Prisma with SQLite datasource
- [ ] T-004 [P] Create .env schema and config loader (validation via zod)
- [ ] T-005 [P] Create /data directory structure and storage utilities
- [ ] T-006 [P] Set up structured logger (pino or equivalent)
- [ ] T-007 [P] Create in-process job queue abstraction (p-queue wrapper)
- [ ] T-008 Create app layout, navigation shell, and theme (dark console aesthetic)
- [ ] T-009 Set up FFmpeg availability check at startup

**Notes:**
- T-001 through T-007 can all start simultaneously.
- T-008 depends on T-001 and T-002 (layout requires both Next.js and Tailwind/shadcn in place).
- T-009 depends on T-001 but not on any other Phase 1 task.

---

### Phase 2 — Domain and Persistence

- [ ] T-010 [P] Define full Prisma schema for all 14 entities
- [ ] T-011 Run initial Prisma migration
- [ ] T-012 [P] Create repository layer for Channel
- [ ] T-013 [P] Create repository layer for ContentIdea
- [ ] T-014 [P] Create repository layer for ScriptPackage
- [ ] T-015 [P] Create repository layer for VideoProject and related entities (AssetRecord, VoiceRender, CaptionFile, RenderJob)
- [ ] T-016 [P] Create repository layer for QARun, PublishPackage, AnalyticsSnapshot
- [ ] T-017 [P] Create repository layer for JobRun
- [ ] T-018 Seed default channel and editorial pillars

**Notes:**
- T-010 must complete before T-011 can run.
- T-012 through T-017 can all run in parallel after T-011 completes.
- T-018 depends on T-012 (requires Channel repository to exist).

---

### Phase 3 — Provider Adapters

- [ ] T-019 [P] Define LLM provider interface (generate, stream, cost tracking)
- [ ] T-020 [P] Define TTS provider interface (synthesize, voices, chunk)
- [ ] T-021 [P] Define image generation provider interface (generate, status, download)
- [ ] T-022 Implement Claude adapter (primary LLM)
- [ ] T-023 Implement ElevenLabs adapter (primary TTS)
- [ ] T-024 Implement image generation adapter (fal.ai or Replicate)
- [ ] T-025 [P] Build provider registry (preferred + fallback per capability)
- [ ] T-026 [P] Build provider health check endpoint
- [ ] T-027 Build provider settings UI screen

**Notes:**
- T-019, T-020, T-021 can start simultaneously and have no dependencies on each other or on Phase 2.
- T-022 depends on T-019; T-023 depends on T-020; T-024 depends on T-021.
- T-025 depends on T-022, T-023, T-024.
- T-026 depends on T-025.
- T-027 depends on T-026.

---

### Phase 4 — Discovery and Scripting Pipeline

- [ ] T-028 [P] Write discovery prompt templates (/prompts/discovery/)
- [ ] T-029 [P] Write script generation prompt templates (/prompts/script/)
- [ ] T-030 [P] Write critic prompt templates (/prompts/critic/)
- [ ] T-031 [P] Write title and metadata prompt templates (/prompts/title/)
- [ ] T-032 Build idea discovery service (LLM call, parse, persist)
- [ ] T-033 Build idea scoring module (8-dimension scorecard)
- [ ] T-034 Build idea discovery UI (pillar selection, seed input, ranked list)
- [ ] T-035 Build script generation service
- [ ] T-036 Build critic pass service (evaluate and return structured critique)
- [ ] T-037 Build script rewrite service (incorporate critique)
- [ ] T-038 Build originality guard (heuristic comparison against history)
- [ ] T-039 Build script review workspace UI
- [ ] T-040 Wire discovery → scoring → selection → scripting pipeline (end-to-end integration)

**Notes:**
- T-028 through T-031 can start simultaneously and in parallel with Phase 3 work.
- T-032 depends on T-022 (Claude adapter) and T-028 (discovery prompts).
- T-033 depends on T-013 (ContentIdea repository).
- T-034 depends on T-032 and T-033.
- T-035 depends on T-022 and T-029.
- T-036 depends on T-022 and T-030.
- T-037 depends on T-036.
- T-038 depends on T-035 and T-036.
- T-039 depends on T-014 (ScriptPackage repository) and T-036.
- T-040 depends on T-032, T-033, T-035, T-036, T-037, T-038.

---

### Phase 5 — Media Pipeline

- [ ] T-041 [P] Write visual direction prompt templates (/prompts/visual/)
- [ ] T-042 Build asset plan generation service
- [ ] T-043 Build voice render service (ElevenLabs, chunk long scripts, stitch audio)
- [ ] T-044 Build caption generation service (word-level timestamps from TTS response)
- [ ] T-045 Build FFmpeg preview composition service (audio + generated images + captions)
- [ ] T-046 Build thumbnail variant generation pipeline
- [ ] T-047 Build production job monitor UI
- [ ] T-048 Wire asset → voice → captions → assembly → thumbnails pipeline (end-to-end integration)

**Notes:**
- T-041 can start in parallel with other Phase 5 work and with late Phase 4 tasks.
- T-042 depends on T-041 and T-024 (image generation adapter).
- T-043 depends on T-023 (ElevenLabs adapter).
- T-044 depends on T-043 (requires TTS response with timestamps).
- T-045 depends on T-044 and T-009 (FFmpeg availability check).
- T-046 depends on T-024 (image generation adapter).
- T-047 depends on T-017 (JobRun repository).
- T-048 depends on T-042, T-043, T-044, T-045, T-046.

---

### Phase 6 — QA and Review

- [ ] T-049 [P] Write QA prompt templates (/prompts/qa/)
- [ ] T-050 Build QA scoring service (8 check categories, PASS/REVIEW/BLOCK)
- [ ] T-051 Build preview and QA review UI screen
- [ ] T-052 Build review approval/rejection/rewrite workflow
- [ ] T-053 Build export package service (assemble folder, generate metadata.json, provenance.json)
- [ ] T-054 Build export package screen UI

**Notes:**
- T-049 can start in parallel with other Phase 6 tasks.
- T-050 depends on T-049 and T-016 (QARun repository).
- T-051 depends on T-050.
- T-052 depends on T-051.
- T-053 depends on T-052 and T-015 (VideoProject repository).
- T-054 depends on T-053.

---

### Phase 7 — Analytics and Learning

- [ ] T-055 Build analytics ingestion endpoint (manual entry form)
- [ ] T-056 Build analytics snapshot storage
- [ ] T-057 Build basic learning loop (hook pattern analysis, pillar performance, weak structure flags)
- [ ] T-058 Build analytics screen UI
- [ ] T-059 Wire learning loop recommendations to dashboard

**Notes:**
- T-055 and T-056 can start in parallel.
- T-057 depends on T-056 (requires snapshot storage).
- T-058 depends on T-057.
- T-059 depends on T-058.

---

### Phase 8 — Hardening and Testing

- [ ] T-060 Unit tests: score calculation, originality heuristics, QA decision rules
- [ ] T-061 Unit tests: state transitions, export builder
- [ ] T-062 Integration tests: idea → script pipeline
- [ ] T-063 Integration tests: script → voice → captions → preview pipeline
- [ ] T-064 Integration tests: QA gating and review approval flow
- [ ] T-065 Failure path tests: provider timeout, FFmpeg failure, missing asset
- [ ] T-066 Policy tests: synthetic cases that must produce a BLOCK result
- [ ] T-067 E2E test: full workflow from channel setup to export package
- [ ] T-068 Add retry and backoff to all provider calls
- [ ] T-069 Finalize structured logging across all services
- [ ] T-070 Write README and setup docs

**Notes:**
- T-060 through T-067 depend on all prior phases being functionally complete.
- T-068 can be worked in parallel with test writing if provider adapters are already in place.
- T-069 can be worked alongside T-068.
- T-070 depends on T-067 (final docs should reflect the complete working system).

---

## Dependency Map

| Task | Depends On |
|---|---|
| T-011 | T-010 |
| T-012 | T-011 |
| T-013 | T-011 |
| T-014 | T-011 |
| T-015 | T-011 |
| T-016 | T-011 |
| T-017 | T-011 |
| T-018 | T-012 |
| T-022 | T-019 |
| T-023 | T-020 |
| T-024 | T-021 |
| T-025 | T-022, T-023, T-024 |
| T-026 | T-025 |
| T-027 | T-026 |
| T-032 | T-022, T-028 |
| T-033 | T-013 |
| T-034 | T-032, T-033 |
| T-035 | T-022, T-029 |
| T-036 | T-022, T-030 |
| T-037 | T-036 |
| T-038 | T-035, T-036 |
| T-039 | T-014, T-036 |
| T-040 | T-032, T-033, T-035, T-036, T-037, T-038 |
| T-042 | T-024, T-041 |
| T-043 | T-023 |
| T-044 | T-043 |
| T-045 | T-009, T-044 |
| T-046 | T-024 |
| T-047 | T-017 |
| T-048 | T-042, T-043, T-044, T-045, T-046 |
| T-050 | T-016, T-049 |
| T-051 | T-050 |
| T-052 | T-051 |
| T-053 | T-015, T-052 |
| T-054 | T-053 |
| T-056 | T-016 |
| T-057 | T-056 |
| T-058 | T-057 |
| T-059 | T-058 |
| T-060–T-067 | All prior phases complete |
| T-068 | T-022, T-023, T-024 |
| T-069 | T-068 |
| T-070 | T-067 |

---

## MVP vs V1 vs Post-V1

### MVP — Minimum Viable Pipeline (Phases 1–6, T-001 through T-054)

MVP delivers a functioning end-to-end production pipeline: topic discovery, script generation with critic pass, originality gating, voice render, captions, FFmpeg video assembly, QA scoring, human review, and export package. Everything required to produce an uploadable Short from a pillar selection.

MVP does not include: analytics ingestion, learning loop, full test coverage, or the YouTube upload API.

### V1 Complete (MVP + Phases 7–8, T-055 through T-070)

V1 adds the analytics and learning loop (performance tracking, pattern surfacing, dashboard recommendations) and full hardening (unit tests, integration tests, E2E tests, retry logic, structured logging, final documentation). V1 is the production-ready release.

### Post-V1 Roadmap

Items explicitly deferred beyond V1:

- YouTube Data API upload integration (direct publish from the console)
- Multi-channel operations (separate channel configs, isolated pipelines)
- Long-form video format (10–20 minute structured video)
- Advanced analytics sync (YouTube Studio API data pull)
- Thumbnail A/B preset system (multiple thumbnail variants with selection tracking)
- Trend ingestion via external APIs (Google Trends, RSS, news APIs)
- Scheduled publish queue with calendar view
- Voice cloning and multi-voice support
- Multi-operator support with role separation
