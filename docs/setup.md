# DarkTube OS — Setup Guide
Version: 1.0

---

## Prerequisites

- Node.js 20 LTS or newer
- npm 10+ or pnpm 9+
- FFmpeg installed and on PATH (required for video assembly)
- Git

Verify each before proceeding:

```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
ffmpeg -version  # should print ffmpeg version x.x or higher
git --version
```

### FFmpeg Installation

FFmpeg is required for the media assembly pipeline. It must be available on the system PATH before the app will allow video render jobs to run.

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu / Debian:**
```bash
sudo apt-get update && sudo apt-get install ffmpeg
```

**Windows:**
1. Download a static build from https://ffmpeg.org/download.html (Windows builds section)
2. Extract the archive to a permanent location (e.g., `C:\ffmpeg`)
3. Add `C:\ffmpeg\bin` to your system PATH via System Properties → Environment Variables
4. Open a new terminal and verify: `ffmpeg -version`

---

## Installation

```bash
git clone <repo>
cd dark
npm install
```

---

## Environment Configuration

Copy `.env.example` to `.env.local` and fill in all required values. Do not commit `.env.local` to source control. It is listed in `.gitignore`.

```bash
cp .env.example .env.local
```

Open `.env.local` in a text editor and set each variable as described below.

### Required Environment Variables

```env
# Database
DATABASE_URL="file:../data/db/darktube.db"

# LLM Provider — required for all generation tasks
ANTHROPIC_API_KEY=your_key_here

# TTS Provider — required for voice render
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_DEFAULT_VOICE_ID=your_voice_id

# Image Generation — required for scene assets (use one of the two)
FAL_AI_API_KEY=your_key_here
# REPLICATE_API_TOKEN=your_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Optional Environment Variables

```env
# Image generation provider preference — fal (default) or replicate
IMAGE_GEN_PROVIDER=fal

# Job queue — max concurrent jobs (default 2)
JOB_CONCURRENCY=2

# Originality thresholds — override system defaults
ORIGINALITY_BLOCK_THRESHOLD=0.40
REUSED_RISK_BLOCK_THRESHOLD=0.70
SIMILARITY_REVIEW_THRESHOLD=0.75
MAX_AUTO_REWRITES=3

# Originality window configuration
PILLAR_DIVERSITY_WINDOW=10
CONSECUTIVE_DELTA_CHECK=2
```

---

## Database Setup

Run the Prisma migration to create the SQLite database, then seed it with the default channel and editorial pillars:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

This creates the SQLite database at `./data/db/darktube.db` and populates:
- One default channel record
- All 8 editorial pillars (labor displacement, cognitive impacts, persuasion and manipulation, social trust erosion, economic concentration, governance blind spots, creative homogenization, psychological consequences)

To reset the database entirely:
```bash
npx prisma migrate reset
```

This drops and recreates the database and reruns the seed. All project data is lost.

---

## Data Directory

The app creates the following directory structure at startup if it does not already exist. You do not need to create it manually.

```
./data/
├── db/            # SQLite database file
├── assets/        # Generated and imported image assets
├── renders/       # Intermediate render files (audio, partial video)
├── exports/       # Final export packages (mp4, thumbnail, metadata, provenance)
├── logs/          # Structured log files (JSON, rotated daily)
└── cache/         # LLM response cache (optional, for development)
```

The entire `/data` directory is gitignored. It is not backed up by source control. Back it up separately on a schedule that matches your production cadence.

---

## Running the App

**Development mode** (hot reload, verbose logging):
```bash
npm run dev
```

**Production build and start:**
```bash
npm run build
npm run start
```

The app runs at http://localhost:3000 in both modes.

---

## First Run Checklist

Complete these steps in order on first launch:

1. Open http://localhost:3000 in your browser
2. Navigate to Settings → Providers
3. Verify that API keys are loaded (either from `.env.local` or enter them in the UI)
4. Run the provider health checks — all three should show green (LLM, TTS, Image Gen)
5. Navigate to Channel Settings
6. Review the seeded channel configuration and update the channel name, description, and publishing cadence to match your actual channel
7. Review the 8 editorial pillars — add, remove, or rename to match your editorial intent
8. Navigate to Ideas → Discover
9. Select a pillar, enter an optional seed topic, and run your first discovery round

If any provider health check fails, return to Settings → Providers, verify the key, and re-run the check before proceeding.

---

## Provider Setup Notes

### Claude (Anthropic) — Primary LLM

Used for all generation tasks: idea discovery, script generation, critic pass, script rewrite, visual direction, QA scoring.

- Get your API key from https://console.anthropic.com
- Default model: `claude-sonnet-4-6` (configurable in provider settings)
- Billing is per-token. Cost tracking is visible per pipeline run in the job monitor.

### ElevenLabs — Voice Synthesis

Used to render the narrator voiceover from the script.

- Get your API key from https://elevenlabs.io
- Create or clone a voice for your channel narrator
- Copy the Voice ID from the voice's detail page in the ElevenLabs UI (it is a string like `21m00Tcm4TlvDq8ikWAM`)
- Paste it as `ELEVENLABS_DEFAULT_VOICE_ID` in `.env.local`
- Recommended voice settings for spoken narration: stability 0.50, similarity_boost 0.75, style 0.30
- These settings can be adjusted in the provider settings UI

### fal.ai — Image Generation

Used to generate scene illustration assets from visual direction prompts.

- Get your API key from https://fal.ai
- Default model: `fal-ai/flux/dev` (configurable in provider settings)
- Set `IMAGE_GEN_PROVIDER=fal` in `.env.local` if using fal.ai

### Replicate (Alternative Image Generation)

If you prefer Replicate over fal.ai:
- Get your API token from https://replicate.com
- Set `REPLICATE_API_TOKEN=your_token` in `.env.local`
- Set `IMAGE_GEN_PROVIDER=replicate` in `.env.local`

---

## Updating

When pulling a new version of the codebase:

```bash
git pull
npm install
npx prisma migrate dev
```

If there are new environment variables in `.env.example` that are not in your `.env.local`, add them before restarting.

---

## Troubleshooting

**FFmpeg not found at startup:**
The app shows a persistent warning in the UI header. Ensure `ffmpeg` is installed and on your PATH. Test with `ffmpeg -version` in a new terminal window. On Windows, a new terminal session is required after PATH changes.

**Database locked error:**
SQLite only allows one writer at a time. Kill any other Node processes that may have the database open (e.g., a previous dev server still running). On macOS/Linux: `lsof data/db/darktube.db` to find the process.

**Provider health check fails:**
Verify the API key is correct and has not been revoked. Check your provider account for rate limit or billing issues. Try the key directly with a curl command to the provider's API to isolate whether the issue is the key or the app.

**Jobs stuck in RUNNING state:**
The in-process job queue does not persist across application restarts. If a job was running when the app crashed or was killed, it will remain in RUNNING state in the database. Restart the app — stuck jobs are automatically marked as FAILED on startup.

**Prisma schema out of sync:**
If you see Prisma client errors after pulling new code, run `npx prisma migrate dev` to apply any new migrations. If that fails, check `npx prisma migrate status` for details.

**Voice render fails mid-chunk:**
This typically indicates an ElevenLabs character limit issue or a network timeout. Check the job logs in `./data/logs/` for the specific chunk index that failed. The adapter retries up to 3 times per chunk before marking the job as FAILED.
