# DarkTube OS

A local-first production console for running a faceless YouTube Shorts channel about AI's hidden side effects.

---

## What it is

DarkTube OS is a private internal tool for one technical creator. It automates the full pipeline from topic discovery to export package while enforcing originality gates and editorial quality standards to protect YouTube monetization viability.

The channel thesis: AI is changing the world in ways most people are not discussing yet, especially the side effects.

Content pillars: labor displacement, cognitive impacts, persuasion and manipulation, social trust erosion, economic concentration, governance blind spots, creative homogenization, psychological consequences.

---

## What it does

- Generates and ranks original topic ideas from editorial pillars using Claude
- Produces differentiated scripts with hooks, beat plans, and mandatory critic passes
- Guards against repetitive AI sludge via 9-dimension originality scoring
- Enforces an editorial delta rule that blocks two consecutive uploads from sharing structure
- Renders voiceover via ElevenLabs, generates scene assets via fal.ai or Replicate
- Assembles word-level captions and composes preview video via FFmpeg
- Scores every package through a QA engine before human review
- Requires explicit human approval against a 6-question checklist before export
- Exports complete upload packages (mp4, thumbnail, metadata.json, provenance.json)
- Tracks analytics and surfaces performance patterns for future content decisions

---

## Design principles

**1. Originality over volume.**
The system is built to produce one defensible Short rather than ten identical ones. Originality scoring, the critic pass, and the editorial delta rule all exist to prevent the channel from drifting into the reused-content category.

**2. Automation executes; humans approve.**
No package can be exported without explicit human sign-off. The automation handles generation and quality scoring. The operator makes the final call on every video.

**3. Every asset is traceable.**
Provenance records are required for every asset. Export is blocked if any asset is missing a source record. The export package includes a machine-readable provenance.json file.

**4. Quality gates are stronger than speed.**
The publish blocker conditions include hard blocks that cannot be overridden. A missing provenance record, an unsupported factual claim, or a corrupted render all stop the package from shipping regardless of how much time has been invested.

**5. The channel needs an editorial fingerprint, not a template factory.**
Every layer of the system — from pillar selection to hook type scoring to critic evaluation — exists to prevent the channel from converging toward the mean output of AI content pipelines. A viewer watching three consecutive uploads should feel a consistent editorial voice, not recognize a template.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui |
| Database | Prisma ORM + SQLite |
| Video assembly | FFmpeg (local, required on PATH) |
| LLM | Claude via Anthropic API |
| Voice synthesis | ElevenLabs |
| Image generation | fal.ai (default) or Replicate |
| Job queue | p-queue (in-process) |
| Logging | pino |

---

## Quick start

Full instructions are in [docs/setup.md](docs/setup.md). The short version:

```bash
git clone <repo>
cd dark
npm install
cp .env.example .env.local   # add your API keys
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Then open http://localhost:3000, verify provider health checks pass, and run your first discovery round from Ideas → Discover.

---

## Documentation

| File | Contents |
|---|---|
| [docs/setup.md](docs/setup.md) | Prerequisites, installation, environment config, first run |
| [docs/prd.md](docs/prd.md) | Product requirements |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/data-model.md](docs/data-model.md) | Data model and entities |
| [docs/event-model.md](docs/event-model.md) | Event system |
| [docs/api-contracts.md](docs/api-contracts.md) | API reference |
| [docs/policy-framework.md](docs/policy-framework.md) | Originality policy, scoring dimensions, publish blockers |
| [docs/risk-register.md](docs/risk-register.md) | Risk register with mitigations and monitoring plan |
| [docs/tasks.md](docs/tasks.md) | Task breakdown, dependency map, MVP scope |

---

## Status

Phase 1 — Documentation and spec artifacts complete. Implementation begins after spec confirmation.

---

## License

Private internal tool. Not for public distribution.
