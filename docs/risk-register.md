# DarkTube OS — Risk Register
Version: 1.0

---

## Risk Table

### R-01 — Reused-Content Risk

**Name:** Reused-Content Risk

**Description:** Output drifts toward minimally differentiated content — scripts that are structurally identical across uploads, visual plans that repeat the same rhythm, and titles that follow the same formula. The channel begins to read as a template factory rather than a channel with editorial intent. YouTube's reused-content enforcement applies to the channel as a corpus, not to individual videos.

**Trigger conditions:**
- Originality scores fall below PASS threshold across multiple consecutive uploads
- Pillar diversity drops below acceptable distribution over the rolling window
- Operator repeatedly overrides originality blocks without meaningful rewrites
- Prompt templates stagnate without periodic variation

**Severity:** High

**Probability:** High

**Impact:** YouTube demonetization or channel strike. Loss of monetization access means the channel's core purpose is eliminated. Recovery requires addressing the pattern across the existing catalog, which may require reuploading or deleting content.

**Primary mitigation:** Originality guard with 9-dimension scoring enforced before every export. Editorial delta check blocks two consecutive videos from sharing opening pattern, core claim, pacing template, visual style template, or thumbnail formula. Critic pass evaluates every script before production.

**Secondary mitigation:** Human review checklist requires the reviewer to explicitly confirm the video is distinct from the last three uploads. Pillar diversity dimension blocks if channel is overconcentrated. Operator overrides are logged and surfaced in the analytics screen for periodic review.

**Owner:** Both

**Status:** OPEN

---

### R-02 — Quality Collapse

**Name:** Quality Collapse

**Description:** Automation drifts into low-value generic scripts as prompt templates age, LLM output regresses toward average, and operator feedback loops degrade. Without active calibration, every AI content pipeline tends toward the mean output of the training distribution — which for AI Shorts content is extremely low.

**Trigger conditions:**
- Critic pass begins consistently returning CONCERN on question 3 (channel point of view)
- Thesis specificity scores cluster near the REVIEW threshold
- Operator accepts CONCERN ratings without escalating to rewrites
- No new prompt template variations added in over 30 days

**Severity:** High

**Probability:** Medium

**Impact:** Videos become indistinguishable from the lowest tier of AI Shorts content. Audience retention drops, algorithm deprioritizes the channel, and the subscriber base fails to form.

**Primary mitigation:** Mandatory critic pass with FAIL-triggers-rewrite logic. Thesis specificity and consequence specificity are hard-scored dimensions that cannot be passed with vague content. Analytics learning loop surfaces retention and CTR patterns to identify quality drift early.

**Secondary mitigation:** `max_auto_rewrites` cap ensures that persistently failing scripts escalate to human review rather than generating an infinite rewrite loop that settles at mediocre. Operator is required to engage with escalations, not just clear them.

**Owner:** Both

**Status:** OPEN

---

### R-03 — Provider Dependency

**Name:** Provider Dependency

**Description:** Output quality, cost, and availability vary across LLM and TTS providers. A provider outage, API deprecation, rate limit, or pricing change can interrupt the production pipeline or degrade output quality without triggering an obvious error.

**Trigger conditions:**
- Primary LLM provider (Claude) returns degraded output or rate-limit errors
- ElevenLabs character limits exceeded for long scripts
- fal.ai or Replicate image generation fails or returns corrupted assets
- Provider API version deprecated with breaking changes

**Severity:** Medium

**Probability:** Medium

**Impact:** Production pipeline stalls. Scripts cannot be generated, voices cannot be rendered, or assets cannot be created. If fallback is not configured, the operator must manually intervene before production can resume.

**Primary mitigation:** Provider registry with preferred + fallback per capability. Health check endpoint surfaces provider status before pipeline execution begins. Retry with backoff on all provider calls (T-068).

**Secondary mitigation:** Provider settings UI allows operator to switch active provider without code changes. All provider calls are isolated behind adapter interfaces (T-019, T-020, T-021), so swapping providers does not require pipeline changes.

**Owner:** System

**Status:** OPEN

---

### R-04 — Local Performance

**Name:** Local Performance

**Description:** Media rendering — particularly FFmpeg composition, audio stitching, and image generation at scale — may be slow or fail on machines with limited CPU, RAM, or disk throughput. The system is designed as a local-first tool and cannot assume server-grade hardware.

**Trigger conditions:**
- FFmpeg encoding of a multi-scene Short takes longer than tolerable on the operator's machine
- Image generation queue backs up due to slow disk writes
- Multiple concurrent job queue workers competing for CPU cause timeouts
- SQLite contention under concurrent read/write from job queue and UI

**Severity:** Medium

**Probability:** Medium

**Impact:** Production round-trips are slow enough to break the operator's workflow. In extreme cases, render jobs time out and produce corrupted output, which triggers B-06 (render corruption blocker).

**Primary mitigation:** Job concurrency is configurable via `JOB_CONCURRENCY` environment variable (default 2). FFmpeg composition is run as a streaming process with progress monitoring. In-process job queue (p-queue) allows backpressure without spawning unbounded workers.

**Secondary mitigation:** FFmpeg availability is checked at startup (T-009) and surfaced to the operator before any pipeline execution begins. Render failures are caught and classified as B-06 rather than silently producing bad files.

**Owner:** System

**Status:** OPEN

---

### R-05 — Prompt Drift

**Name:** Prompt Drift

**Description:** Repeated use of the same prompt templates causes the LLM to produce increasingly convergent output over time — not because the model has learned anything, but because the prompt's implicit constraints narrow the output distribution toward a local optimum. This is distinct from quality collapse: the output may maintain quality on individual dimensions while losing diversity across the channel's content profile.

**Trigger conditions:**
- Same prompt template used without variation for more than 20 consecutive scripts
- Discovery prompts consistently return ideas from the same sub-topics within a pillar
- Script generation prompts consistently produce the same beat structures

**Severity:** Medium

**Probability:** High

**Impact:** Pillar diversity and structural novelty scores begin degrading without obvious cause. The operator may attribute this to topic exhaustion rather than prompt convergence, missing the actual cause.

**Primary mitigation:** Discovery, scripting, and critic prompt templates are stored as versioned files in `/prompts/`. The analytics learning loop surfaces pillar concentration and structural novelty trends, which serve as indirect indicators of prompt drift.

**Secondary mitigation:** The pillar diversity dimension (dimension 4) will surface clustering before it becomes critical. Operator can introduce prompt variation by editing template files. Prompt file modification timestamps can be used to flag templates that have not been updated in a long time (future enhancement).

**Owner:** Operator

**Status:** OPEN

---

### R-06 — Asset Provenance Gaps

**Name:** Asset Provenance Gaps

**Description:** If assets are used in a video without a complete provenance record — source, license type, creation method, creator — the channel cannot defend its content claims if challenged by YouTube's content ID system or a copyright claim. Missing provenance also prevents the system from accurately calculating reused-content risk.

**Trigger conditions:**
- Asset added to a project without a source record being created
- External asset imported manually without going through the provenance workflow
- Provenance record created with incomplete or placeholder values
- Export builder skips provenance validation due to a code bug

**Severity:** High

**Probability:** Low

**Impact:** Copyright claim on monetized video, revenue hold, or Content ID strike. In the worst case, a missing provenance record means the operator cannot demonstrate that content is original when challenged. B-05 hard blocks export if any asset lacks provenance, limiting the blast radius.

**Primary mitigation:** B-05 (missing provenance) is a hard block with no override. The export builder validates all asset provenance records before allowing export to proceed. Assets are created through the asset plan generation service, which creates provenance records as part of the workflow.

**Secondary mitigation:** The provenance.json file in every export package provides an auditable record. Operator is trained (via setup docs) to enter provenance information for any manually imported assets.

**Owner:** Both

**Status:** OPEN

---

### R-07 — Overengineering

**Name:** Overengineering

**Description:** Adding too many abstractions, configuration layers, or extensibility hooks slows delivery without adding value to the V1 use case. The system is a single-operator internal tool — complexity justified by multi-tenant or enterprise requirements is not appropriate here.

**Trigger conditions:**
- Provider abstraction layer adds more than one layer of indirection per call
- Database schema exceeds what the defined 14 entities require
- Configuration system requires more than one file to understand
- Job queue abstraction obscures rather than simplifies retry logic

**Severity:** Low

**Probability:** Medium

**Impact:** Slower delivery of functional phases. Maintenance burden increases without user-facing benefit. The operator spends time debugging abstraction layers rather than producing content.

**Primary mitigation:** Architecture is explicitly scoped to V1 requirements. Post-V1 features (YouTube upload API, multi-channel ops, advanced analytics sync) are deferred. The task list (docs/tasks.md) marks MVP scope explicitly.

**Secondary mitigation:** Code review process (implicit in Phase 8 hardening) catches unnecessary abstraction before it accumulates. Provider interfaces are defined as minimal contracts (generate, stream, cost tracking) rather than comprehensive abstractions.

**Owner:** System

**Status:** OPEN

---

### R-08 — Shorts Retention Miss

**Name:** Shorts Retention Miss

**Description:** Content may be intellectually substantive and editorially original but still fail to retain viewers on the Shorts format. Shorts audience behavior is driven by pattern interrupts, pacing, and emotional engagement in the first three seconds — qualities that are hard to engineer via LLM scripting alone.

**Trigger conditions:**
- Hook novelty scores are high but actual viewer retention (from analytics) is below 40% at the 5-second mark
- Scripts pass all originality checks but average view duration is low
- Thumbnail CTR is below 5% despite passing title novelty checks

**Severity:** Medium

**Probability:** Medium

**Impact:** Channel fails to grow despite producing original, quality content. Monetization is delayed or unachievable. The automation investment does not yield audience traction.

**Primary mitigation:** Hook novelty dimension specifically evaluates the opening phrase and hook type to push variety. Critic pass question 3 (channel point of view) forces consideration of viewer engagement, not just informational quality. Analytics learning loop (Phase 7) surfaces retention patterns and feeds them back as recommendations.

**Secondary mitigation:** Human review checklist question 3 requires the reviewer to evaluate whether the hook would stop scrolling. This is a subjective but necessary check that the automation cannot fully substitute.

**Owner:** Operator

**Status:** OPEN

---

### R-09 — English Naturalness

**Name:** English Naturalness

**Description:** Scripts generated by LLMs may read naturally in isolation but sound unnatural when spoken — overly formal phrasing, awkward rhythm for voiceover, passive constructions, or hedging language that drains energy from the delivery. ElevenLabs renders what it receives; it cannot fix unnatural prose.

**Trigger conditions:**
- Script contains more than 3 passive constructions in 60 seconds of content
- Sentences average more than 20 words, creating poor breathing rhythm for TTS
- Hedging language density is high ("could potentially," "in some cases," "it might be argued")
- Critic pass question 1 returns CONCERN citing mechanical phrasing

**Severity:** Medium

**Probability:** Medium

**Impact:** Voiceover sounds stilted or robotic regardless of voice quality. Viewer perception of the channel degrades. Retention drops at points where unnatural phrasing causes listener dissonance.

**Primary mitigation:** Script generation prompt templates are written to explicitly instruct for spoken-word natural language, short sentences, active voice, and direct assertion. Critic pass question 1 (does this sound mass-produced) catches mechanical phrasing.

**Secondary mitigation:** Human reviewer listens to the voice preview before approving. The QA screen includes an audio player for this purpose. Operator may request a targeted rewrite of specific script sections from the review workspace.

**Owner:** Both

**Status:** OPEN

---

### R-10 — FFmpeg Unavailability

**Name:** FFmpeg Unavailability

**Description:** The entire media assembly pipeline depends on FFmpeg being installed and accessible on the PATH. If FFmpeg is missing, misconfigured, or broken, no video can be rendered. This is a silent dependency that is not always obvious on a fresh machine setup.

**Trigger conditions:**
- FFmpeg not installed on the operator's machine
- FFmpeg installed but not on the system PATH
- FFmpeg version incompatible with the commands used (very old version)
- FFmpeg binary corrupted or unexecutable due to permissions

**Severity:** High

**Probability:** Low

**Impact:** The entire Phase 5 media pipeline is non-functional. Voice render and caption generation can proceed, but no video file can be produced. The system cannot export a complete upload package.

**Primary mitigation:** FFmpeg availability check runs at application startup (T-009) and displays a visible warning in the UI if FFmpeg is not found or not executable. The setup guide (docs/setup.md) provides installation instructions for macOS, Ubuntu, and Windows. The check runs `ffmpeg -version` and validates the response before allowing pipeline jobs to be queued.

**Secondary mitigation:** The operator checklist in setup.md includes FFmpeg verification as step 1 before running the application. Startup warning is persistent until the issue is resolved — it does not disappear after acknowledgment.

**Owner:** Operator

**Status:** OPEN

---

### R-11 — API Key Exposure

**Name:** API Key Exposure

**Description:** Provider API keys (Anthropic, ElevenLabs, fal.ai, Replicate) are stored in `.env.local` and must never be committed to source control. Accidental git commit of these keys results in immediate exposure and likely key revocation by the provider.

**Trigger conditions:**
- `.env.local` accidentally added to git staging area
- Operator copies key values into a file that is tracked by git
- `.gitignore` is misconfigured or accidentally deleted
- IDE or tool automatically stages all changed files

**Severity:** High

**Probability:** Low

**Impact:** Provider keys are exposed in git history. Even a force-push does not remove keys from all forks or mirrors. The operator must immediately revoke and rotate all exposed keys. Depending on usage, there may be cost exposure from unauthorized use before revocation.

**Primary mitigation:** `.env.local`, `.env`, and the entire `/data` directory are gitignored. `.env.example` is committed with placeholder values only, never real keys. Setup guide explicitly instructs the operator never to commit real keys.

**Secondary mitigation:** Pre-commit hooks (or a documented manual check) verify that no file containing a key pattern is staged. Provider settings UI allows keys to be entered through the application rather than the environment file, reducing the need to handle key values directly in the terminal.

**Owner:** Operator

**Status:** OPEN

---

### R-12 — Originality Guard False Positives

**Name:** Originality Guard False Positives

**Description:** The originality scoring heuristics may flag legitimately original content as BLOCK or REVIEW due to surface-level similarity that does not reflect actual reuse. A strong original script that happens to open with a similar sentence to a recent video, or that falls on the same editorial pillar twice in a row for good editorial reasons, may be blocked unnecessarily.

**Trigger conditions:**
- Channel is genuinely exploring a focused series within a single pillar
- A strong hook type (e.g., contradiction) is legitimately the best choice twice in succession
- Lexical novelty scores low because the topic requires specific technical vocabulary that overlaps with a recent script
- Operator is early in channel life where the history window is small and any pattern looks like repetition

**Severity:** Low

**Probability:** Medium

**Impact:** Operator frustration and workflow interruption. If overrides require too much friction, the operator may disable gates or consistently override without review, defeating their purpose.

**Primary mitigation:** Every REVIEW and BLOCK score includes a written explanation of which dimension triggered and why. This allows the operator to make an informed override decision rather than guessing. Override mechanism is available with a single justification field — it is not high-friction.

**Secondary mitigation:** Thresholds are configurable. An operator running a deliberate series can lower the pillar diversity threshold or adjust the consecutive delta check window to match their editorial intent. Threshold changes are documented in the setup guide.

**Owner:** System

**Status:** OPEN

---

### R-13 — ElevenLabs Character Limit

**Name:** ElevenLabs Character Limit

**Description:** ElevenLabs TTS API imposes per-request character limits. YouTube Shorts scripts can run long enough to exceed these limits, particularly if the script includes repeated sections, detailed captions, or is generated for a longer-format Short (up to 60 seconds). Exceeding the limit causes the voice render job to fail mid-execution.

**Trigger conditions:**
- Script length exceeds the per-request character limit for the selected ElevenLabs plan
- Script is passed to the TTS adapter without chunking
- A single beat (e.g., a long data-heavy consequence section) exceeds one chunk limit

**Severity:** Medium

**Probability:** Medium

**Impact:** Voice render job fails. If not handled gracefully, the failure leaves the project in an inconsistent state with partial audio files. The operator must manually intervene to clear the failed state.

**Primary mitigation:** The ElevenLabs adapter (T-023) chunks long scripts at sentence boundaries before submission, then stitches the resulting audio files. Chunk size is set conservatively below the API limit. The voice render service (T-043) handles chunking and stitching transparently.

**Secondary mitigation:** Job failure handling in the voice render service records the chunk index at which failure occurred, allowing retry from that point rather than from the beginning. Render corruption check (B-06) catches stitching artifacts in the assembled audio.

**Owner:** System

**Status:** OPEN

---

## Monitoring Plan

Risks are monitored through a combination of automated system metrics, analytics learning loop outputs, and periodic operator review.

**R-01 (Reused-Content Risk):** Monitored by originality scores on every package (automated), pillar diversity dimension on every upload (automated), and operator review of the analytics screen's pillar distribution chart (weekly cadence recommended).

**R-02 (Quality Collapse):** Monitored by critic pass ratings tracked over time in QARun records. Analytics learning loop (T-057) flags if CONCERN or FAIL rates on any critic question increase over a rolling 20-video window.

**R-03 (Provider Dependency):** Monitored by the provider health check endpoint, which is surfaced in the Settings → Providers screen. Health checks run before each pipeline job. Provider errors are logged and surfaced in the job monitor UI.

**R-04 (Local Performance):** Monitored by job run duration timestamps stored in JobRun records. Analytics screen can surface average render time trends. Operator monitors the job queue UI during production runs.

**R-05 (Prompt Drift):** Monitored indirectly by pillar diversity and structural novelty dimension trends over the rolling window. Analytics learning loop flags structural novelty degradation. Operator should review prompt template files monthly and introduce variation.

**R-06 (Asset Provenance Gaps):** Monitored by B-05 hard block — any provenance gap is caught before export. Periodic audit of the AssetRecord table can surface records with missing or placeholder source fields.

**R-07 (Overengineering):** Monitored by delivery velocity — tracked informally by comparing planned vs. actual task completion dates. If phases are running significantly behind estimate, the operator reviews whether abstraction overhead is a contributing factor.

**R-08 (Shorts Retention Miss):** Monitored by analytics ingestion (T-055) — the operator manually enters retention and CTR metrics after upload. Analytics learning loop (T-057) surfaces retention patterns and flags underperforming hook types or pillar categories.

**R-09 (English Naturalness):** Monitored by the human reviewer's audio preview step in the QA screen. Systematic naturalness issues are surfaced when the reviewer consistently flags the same types of phrasing issues during the review workflow.

**R-10 (FFmpeg Unavailability):** Monitored by the startup check (T-009), which runs on every application start. The check result is stored and surfaced in the UI header until resolved.

**R-11 (API Key Exposure):** Monitored by pre-commit hygiene. No automated monitoring is practical for this risk — it depends on operator discipline. The setup guide establishes the practice. An optional pre-commit hook can scan for key-shaped strings in staged files.

**R-12 (Originality Guard False Positives):** Monitored by the rate of operator overrides — visible in QARun records. If override rate exceeds 30% of blocked packages over a 20-video window, the thresholds or heuristics should be recalibrated.

**R-13 (ElevenLabs Character Limit):** Monitored by voice render job failure rates in JobRun records. If chunk-related failures increase, the chunk size threshold in the ElevenLabs adapter should be lowered.
