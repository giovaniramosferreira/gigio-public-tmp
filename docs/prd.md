# DarkTube OS — Product Requirements Document

Version: 1.0 | Status: Draft | Owner: Giovani Ramos Ferreira

---

## Problem

English-language AI content on YouTube is saturated with generic "top tools" and "AI news" formats. Engagement is high but differentiation is near zero. There is a measurable gap for high-signal analytical content focused on AI's second-order effects — labor displacement, cognitive dependency shifts, trust erosion in institutions, infrastructure concentration, and policy blind spots — delivered in Shorts format where attention is captured in the first two seconds and held through tight editorial discipline.

Producing this kind of content consistently at 5-7 Shorts per week requires automation that simultaneously maintains originality (to protect YouTube monetization eligibility), editorial quality (to build audience trust), and production efficiency (to keep a solo operator from burning out on repetitive tasks). No existing tool addresses all three constraints together. General-purpose AI writing tools have no concept of originality history. Video production tools have no concept of editorial pillars or content strategy. YouTube analytics tools have no connection to the content pipeline that produced the results.

DarkTube OS solves this by being a purpose-built local production console for this specific content type, operated by a single technical creator who values system quality over toy tools.

---

## Goals

- Automate the research-to-publish pipeline for a faceless English Shorts channel focused on AI second-order effects
- Maintain above-average originality scores to protect YouTube monetization eligibility across the channel's content history
- Enable a single operator to publish 5-7 Shorts per week without the pipeline becoming the bottleneck
- Enforce mandatory human review before any content is approved for export
- Build infrastructure that is cleanly upgradeable beyond V1 without requiring rewrites

---

## Non-Goals (V1)

The following are explicitly out of scope for V1. Deferring these allows V1 to ship as a focused, reliable tool rather than an overbuilt prototype.

- Long-form video production (videos over 60 seconds)
- Multi-platform publishing (TikTok, Instagram Reels, YouTube regular uploads)
- Multi-user or team collaboration features
- SaaS mode or multi-tenant architecture
- Autonomous publishing without mandatory human approval at the review stage
- Native YouTube Data API upload integration (deferred to V2 to avoid OAuth complexity in V1)
- Web research automation (deferred to V1.5; manual seed notes used in V1)
- Background music generation (user-provided files only in V1)

---

## User Persona

**Solo technical creator.** Understands REST APIs, environment variables, and local development tooling. Comfortable running `npm install` and editing `.env` files. Values system quality, reliability, and repeatability over flashy UI. Willing to pay for premium API providers (ElevenLabs, Claude, fal.ai) when the quality justifies the cost. English is the channel language. Content focus is analytical and editorial, not entertainment-first. The operator's primary constraint is time, not capability. They want a serious production console — a tool that earns trust through consistent outputs — not a prompt playground that produces different results every run.

---

## Core Workflows

### Workflow 1: Idea Discovery

The operator opens the Ideas section and either selects an editorial pillar from the channel's configured pillars (e.g., "Labor Displacement," "Cognitive Dependency," "Infrastructure Concentration") or enters a free-text seed theme. The Discovery Service sends the pillar and optional seed notes to Claude with the discovery prompt template. Claude returns 25 or more topic candidates, each with a proposed hidden angle that avoids the obvious framing, a hook direction, and a predicted novelty assessment. The system scores each candidate on novelty, editorial fit, and estimated hook strength. The operator sees the ranked list in the Ideas UI, can filter by pillar, sort by score, and dismiss candidates. The operator selects one idea to advance to scripting.

### Workflow 2: Script Generation

The selected idea passes to the Script Service. Claude generates a thesis statement, three to five hook options ordered by estimated strength, a full 30-50 second script with beat timing annotations, and a beat plan that maps script sections to visual directions. A critic pass evaluates the generated script against quality criteria defined in the critic prompt template: hook strength, thesis clarity, factual grounding tone, editorial originality, and monetization safety. The originality guard compares the script against the channel's history of approved scripts using text similarity analysis; if similarity exceeds the configured threshold, an automatic rewrite is triggered. After up to three automatic rewrites, scripts that still exceed the threshold are flagged for human review. Scripts that pass critic and originality review enter the APPROVED_FOR_PRODUCTION status. The operator can review the script, critic notes, and originality score in the Script Workspace before production begins.

### Workflow 3: Production

An approved script triggers the Production pipeline via the Job Orchestrator. The Asset Direction Service uses Claude to generate a detailed visual asset plan: one background image prompt per scene, B-roll direction notes, color palette guidance, and thumbnail concept options. The Voice Service sends the script to ElevenLabs using the configured voice profile and receives the audio render. The Caption Service aligns captions to the audio render by splitting the script at sentence and clause boundaries and calculating timing from the audio duration. The Video Assembly Service invokes FFmpeg to composite the background images, voice audio, burned-in captions, and optional ambient audio into a preview MP4. The Thumbnail Generator produces three thumbnail variants using the image generation provider. The QA Service evaluates the assembled package against a checklist: audio quality, caption accuracy, visual contrast, thumbnail readability, file completeness. The operator can monitor job progress in the Production UI.

### Workflow 4: Review and Export

A QA-passed package appears in the Review screen. The operator watches the preview video, reads the script and caption overlay, and reviews thumbnail variants. The operator can approve the package, reject it with a rejection reason that triggers a rewrite cycle, or request a specific revision (script rewrite, voice re-render, asset regeneration). On approval, the Export Service writes a structured export package to `/data/exports/{video-slug}/`: the video MP4, thumbnail variants, a `metadata.json` with title, description, and tag suggestions, and the script as a text file. The package is ready for manual upload to YouTube Studio.

### Workflow 5: Analytics Learning

After publishing, the operator manually enters or imports post-publish performance data into the Analytics section. Import supports YouTube Studio CSV export format. The Analytics Service parses and stores view count, watch time percentage, click-through rate, and likes. The system surfaces patterns on the Analytics dashboard: strongest hook archetypes by average CTR, pillar performance rankings, and underperforming topic patterns. A weekly digest (computed on trigger or on schedule) summarizes the channel's performance trajectory and surfaces recommended pillar adjustments based on the data.

---

## Functional Requirements

| ID | Name | Priority | Acceptance Criteria Summary |
|---|---|---|---|
| FR-01 | Channel Configuration | P0 | Operator can configure channel name, editorial pillars (name, description, content rules), provider API keys, voice profile, and originality threshold. Settings persist in SQLite. All provider keys validated on save. |
| FR-02 | Idea Generation | P0 | Given a pillar selection or seed text, system generates 25 or more topic candidates via Claude. Each candidate includes hidden angle, hook direction, and novelty note. Generation completes within 30 seconds. |
| FR-03 | Idea Scoring and Ranking | P0 | Each generated idea receives a composite score based on novelty, pillar fit, and hook strength. Ideas are displayed in ranked order. Operator can resort and filter by pillar. |
| FR-04 | Script Generation | P0 | Selected idea produces a full script including thesis, 3-5 hook variants, a 30-50 second narration script with beat timing, and a beat plan with visual direction notes. |
| FR-05 | Critic Pass | P0 | Every generated script is evaluated by a separate critic prompt before reaching the operator. Critic output includes pass/fail verdict, per-criterion scores, and rewrite instructions if failing. |
| FR-06 | Originality Guard | P0 | Every approved script is compared against historical approved scripts. Similarity score is displayed. Scripts above threshold (default 0.75) trigger automatic rewrite or NEEDS_HUMAN_REVIEW status. |
| FR-07 | Script Workspace | P0 | Operator can read the script, critic notes, originality score, and hook variants in a single review UI. Operator can manually edit the script. Manual edits re-trigger critic pass on save. |
| FR-08 | Asset Direction | P1 | Approved script produces a visual asset plan: per-scene background image prompts, B-roll direction, color palette, and thumbnail concept variants. |
| FR-09 | Voice Render | P0 | Script is sent to ElevenLabs with configured voice profile. Audio returned as MP3. Voice Service handles chunking for long scripts. Rendered audio stored in `/data/assets/`. |
| FR-10 | Ambient Audio | P2 | Operator can upload a royalty-free audio file in settings. Video assembly mixes ambient audio at configurable volume under the voice track. If no file is provided, voice-only output is produced. |
| FR-11 | Caption Alignment | P1 | Captions are generated from the script and aligned to the audio duration. Default is burned-in captions for Shorts compatibility. SRT sidecar is also exported. Caption style is configurable (font, size, position, color). |
| FR-12 | Video Assembly | P0 | FFmpeg composites background images, voice audio, captions, and optional ambient audio into a preview MP4 at 1080x1920 (9:16). Assembly completes without manual intervention. |
| FR-13 | Thumbnail Generation | P1 | Three thumbnail variants are generated using the configured image provider from the thumbnail concepts in the asset plan. Variants are scored for readability (contrast, text density). Best variant is highlighted. |
| FR-14 | QA Scoring | P0 | QA Service evaluates the assembled package: audio levels within acceptable range, captions present and timed, video file valid, at least one thumbnail generated, file sizes within expected bounds. QA pass is required to unlock the export action. |
| FR-15 | Review and Approval | P0 | Review screen shows video preview, script, captions, thumbnails, QA report, and critic score. Operator can approve, reject, or request specific revision. Approval status is recorded with timestamp. |
| FR-16 | Package Export | P0 | Approved package is written to `/data/exports/{video-slug}/` containing: video MP4, thumbnail variants (JPG), metadata.json (title, description, tags), and script.txt. Export is atomic; partial exports are cleaned up on failure. |
| FR-17 | Analytics Ingestion and Dashboard | P1 | Operator can import YouTube Studio CSV or enter metrics manually. Dashboard shows pillar performance rankings, top hook archetypes by CTR, weak patterns, and a weekly digest. All data stored in SQLite analytics tables. |

---

## Metrics

### 6.1 Production Velocity Metrics

- **Target:** 5-7 Shorts exported per week from a single operator session
- **Idea-to-script time:** Under 5 minutes of operator active time per script (excluding review)
- **Script-to-export time:** Under 15 minutes of total pipeline time per video (wall clock, operator passive)
- **Rewrite rate:** Less than 30% of scripts require more than one automatic rewrite pass
- **QA pass rate:** Greater than 90% of assembled videos pass QA without manual intervention

### 6.2 Quality Metrics

- **Originality score:** All exported scripts score below the configured similarity threshold (default 0.75) against the channel history
- **Critic pass rate on first generation:** Target 70% or higher — scripts that pass critic without rewrite
- **Thumbnail readability score:** All exported thumbnails score above minimum contrast ratio threshold
- **Audio quality:** All rendered audio files have peak levels within -3dBFS to -6dBFS range

### 6.3 System Reliability Metrics

- **Job failure rate:** Less than 5% of production jobs fail due to system error (not provider error)
- **Provider retry success rate:** Greater than 80% of provider failures resolved within 3 retry attempts
- **Data integrity:** Zero silent data loss events; all failures surfaced to operator with actionable error messages
- **Startup time:** Application ready for operator use within 10 seconds of `npm run start`

---

## Acceptance Criteria by Workflow

### Workflow 1: Idea Discovery

- Given a configured editorial pillar, the system generates 25 or more distinct topic candidates in under 30 seconds
- Each candidate includes a hidden angle that differs from the obvious treatment of the topic
- Generated ideas are scored and displayed in ranked order with score breakdown visible on hover
- The operator can dismiss individual ideas without affecting the rest of the list
- Previously selected ideas are marked in the list so the operator does not reselect similar angles

### Workflow 2: Script Generation

- A selected idea produces a complete script package (thesis, hooks, narration, beat plan) in a single generation pass
- The critic pass runs automatically and produces a pass/fail verdict with per-criterion scores before the script reaches the operator
- Scripts that fail the critic pass are rewritten automatically up to 3 times before the operator is notified
- The originality score is displayed alongside the script with the closest historical match excerpt
- The operator can approve the script for production directly from the Script Workspace without navigating away

### Workflow 3: Production

- All production steps (asset direction, voice render, caption alignment, video assembly, thumbnail generation, QA) run without operator interaction after the operator triggers the production job
- Job progress is visible in real time in the Production UI with per-step status indicators
- A failed job step displays the error message and offers a retry action for that specific step
- The assembled video is available for preview in the Review screen within 5 minutes of production job start under normal provider conditions
- QA failures are displayed as a checklist with each failing criterion identified

### Workflow 4: Review and Export

- The Review screen loads the assembled video, script, thumbnails, and QA report in a single view
- Operator approval requires an explicit confirm action (not a default or auto-advance)
- Rejected packages return to the appropriate pipeline stage with the rejection reason logged
- Export produces a complete, correctly named directory under `/data/exports/` within 10 seconds of approval
- The `metadata.json` in the export package contains all fields required for YouTube Studio manual upload

### Workflow 5: Analytics Learning

- YouTube Studio CSV export can be imported without pre-processing; the system parses the CSV format directly
- Dashboard pillar performance rankings update immediately after import
- Weekly digest is computed on demand via a button as well as on the configured schedule
- The dashboard surfaces at least one actionable recommendation per session (e.g., "Hook type X outperforms average by 2.3x CTR")
- All analytics data is stored persistently; previous imports are not overwritten by new imports for the same date range
