# DarkTube OS — Prompt Templates

LLM prompt templates for the DarkTube OS YouTube Shorts production pipeline.

Channel thesis: AI is changing the world in ways people are not talking about enough — especially the side effects.

These templates are the heart of the product's originality guarantee. They encode the editorial point of view and the anti-slop / originality discipline at every stage, from idea discovery through final QA.

## Template format

Every template is a Markdown file with a consistent structure:

1. **Frontmatter** — a `---` delimited block at the top with:
   - `version` — integer, the template version (see Versioning below).
   - `stage` — the pipeline stage this template serves.
   - `model_role` — the role the model plays in this stage.
   - `expects_json` — `true` or `false`; whether the model must return JSON.
   - `output_schema` — a brief description of the expected output shape.
2. **`# System`** — the system prompt: persona, editorial standard, and constraints.
3. **`# User Template`** — the user message with `{{variable}}` placeholders.
4. **`# Output Contract`** — the exact expected output, including JSON shape when `expects_json` is true.
5. **`# Anti-Slop Rules`** — what the model must avoid (present where relevant).

## Variable interpolation

The `# User Template` section uses `{{variable}}` placeholders. The orchestrator is expected to substitute each `{{variable}}` with a real value before sending the prompt to the model. Variable names are stable within a template version; changing a variable name is a breaking change and warrants a version bump.

## Versioning

The filename stays stable across versions (e.g. `discover-ideas.md` is always `discover-ideas.md`). The `version` field in the frontmatter is bumped when the template's behavior, variables, or output contract change. This keeps references and imports stable while letting the orchestrator pin or migrate versions deliberately.

## Templates

| File | Stage | Expects JSON |
| --- | --- | --- |
| `discovery/discover-ideas.md` | discovery | yes |
| `script/generate-script.md` | script | yes |
| `critic/critique-script.md` | critic | yes |
| `critic/rewrite-script.md` | critic-rewrite | yes |
| `visual/scene-directions.md` | visual | yes |
| `title/generate-metadata.md` | metadata | yes |
| `qa/qa-review.md` | qa | yes |

## Pipeline flow

1. **discovery** — generate original topic ideas from a pillar and seeds.
2. **script** — turn a selected idea into a full script package.
3. **critic** — adversarially review the script; verdict APPROVE / REWRITE / BLOCK.
4. **critic-rewrite** — if REWRITE, produce an improved package in the same shape, then re-critique.
5. **visual** — generate per-beat visual directions and image prompts.
6. **metadata** — write native-sounding titles, descriptions, hashtags, pinned comment.
7. **qa** — final originality and policy gate; decision PASS / REVIEW / BLOCK before human review.
