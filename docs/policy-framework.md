# DarkTube OS — Policy Framework
Version: 1.0

---

## 1. Originality Principles

The system treats originality as a first-class product requirement, not a quality-of-life nicety. YouTube's reused-content policy evaluates whether material was repurposed without significant original commentary, substantive modification, or added educational or entertainment value — and applies this standard to the channel as a whole, not just individual videos.

A channel that publishes ten individually acceptable videos but does so with the same structure, the same rhetorical moves, and the same vague framing accumulates reused-content risk as a body of work. YouTube's enforcement surface is the channel, not the video.

This means the system must prevent cumulative drift toward sludge even when each individual video passes initial checks. The policy framework governs this at four levels:

1. **Per-asset gates** — individual videos are scored before production begins
2. **Consecutive-upload gates** — two adjacent uploads are compared before either ships
3. **Channel-window checks** — the last N uploads are analyzed for pillar and pattern distribution
4. **Critic pass** — a structured adversarial review is run on every script

All four gates must pass before a package moves to export.

---

## 2. Forbidden Output Patterns

These patterns are drawn from spec section 17.2. Each one individually degrades quality; in combination they constitute the core failure mode of AI-assisted content channels.

### 2.1 Templated intro repeated with near-identical wording

**What it looks like:** Every video opens with the same sentence shape — "Most people think X, but actually Y" or "Nobody is talking about what AI is doing to Z" — with only the topic noun swapped.

**Why it is harmful:** Identical openings train the viewer to skip the first ten seconds, destroy hook effectiveness, and signal mass production to any reviewer sampling the channel.

**Detection:** The originality guard compares the opening two sentences of each new script against the opening two sentences of every script in the last `pillar_diversity_window` uploads. Trigram overlap above `similarity_review` threshold (default 0.75) triggers a hook novelty review flag.

---

### 2.2 Same narrative arc reused too often

**What it looks like:** Every Short follows the same arc — Problem Introduced / Statistic Dropped / Implication Named / Call to Reflect. The beats change words but not structure.

**Why it is harmful:** Viewers internalize the rhythm and disengage. The channel develops a mechanical quality that reads as automated. YouTube sampling of a channel's catalog reveals the pattern immediately.

**Detection:** Beat plan templates are extracted from each script and compared against the last N scripts using structural novelty scoring. If more than 3 of the last 10 scripts share the same arc signature, the new script is flagged for structural rewrite before proceeding.

---

### 2.3 Same title formula repeated too often

**What it looks like:** Every title is "The Hidden Cost of [AI Thing]" or "What [Company] Doesn't Want You to Know About [AI Thing]" with only the slot filled.

**Why it is harmful:** Title-formula clustering signals a channel operating off a template factory. It also reduces CTR over time as audiences habituate to the formula.

**Detection:** Title pattern novelty scoring extracts the structural formula (e.g., `The [Adj] [Noun] of [Proper Noun]`) and compares it against the last N title formulas. A formula match above `similarity_review` threshold blocks the title from shipping without a revision.

---

### 2.4 Generic "AI is changing everything" scripts

**What it looks like:** Scripts that describe AI's impact in broad, unanchored terms — "AI is transforming the way we work," "AI is reshaping society" — without specifying what changed, for whom, when, and with what measurable effect.

**Why it is harmful:** These scripts add no informational value. They could be written by any model given the topic noun. They create the impression of depth while delivering none. Platform-quality expectations are violated because the content provides nothing a viewer could not already assume.

**Detection:** Thesis specificity scoring (dimension 8) flags scripts where the main claim does not name a specific mechanism, population, timeline, or measurable outcome. A thesis specificity score below 0.4 is a hard BLOCK.

---

### 2.5 Vague claims without concrete consequence

**What it looks like:** A script that says "AI is affecting the job market" without specifying which job categories, which timeframe, which mechanism, or what has already happened — as opposed to what might happen.

**Why it is harmful:** Vague claims cannot be verified, cannot be searched, and cannot be remembered. They create the texture of insight without delivering it. This is the primary quality failure mode for AI Shorts channels.

**Detection:** Consequence specificity scoring (dimension 9) evaluates whether each causal claim names a real-world consequence with enough specificity to be falsifiable. Scripts where more than two claims fail this check receive a consequence specificity BLOCK.

---

### 2.6 Repetitive visual rhythm across consecutive uploads

**What it looks like:** Every Short uses the same pacing rhythm — slow opening card, mid-video montage of three still images, text overlay conclusion — regardless of topic or tone.

**Why it is harmful:** Identical visual rhythm across a channel creates a mechanical feel that undermines the perception of editorial intent. It also signals template use to any human reviewer watching more than one video.

**Detection:** Visual composition novelty scoring compares the scene structure plan (number of scenes, type of each scene, transition type distribution) against the last N uploads. A match above threshold triggers a mandatory visual direction revision.

---

### 2.7 Barely modified public clips as primary asset base

**What it looks like:** The video consists primarily of B-roll or stock footage with minimal original narration or commentary layered over it, or uses footage that is widely circulated online with only a voiceover added.

**Why it is harmful:** This is the canonical YouTube reused-content violation. Even with a voiceover, a video built primarily on someone else's footage without transformative editorial framing is at direct policy risk.

**Detection:** The asset provenance system requires every asset to have a source record. Assets classified as `external_clip` trigger a reused risk score increment. If `reused_risk_score` exceeds 0.70, the package is blocked.

---

### 2.8 Content that sounds like stitched trend summaries

**What it looks like:** A script that summarizes three or four recent AI news stories in sequence without connecting them, drawing an original conclusion, or providing analysis beyond what any aggregator newsletter already published.

**Why it is harmful:** Trend-summary content has near-zero shelf life, near-zero search value, and near-zero differentiation. It reads as content farming even when each individual point is factually accurate.

**Detection:** Critic pass question 5 ("What makes this different from hundreds of generic AI Shorts?") specifically targets this pattern. A FAIL rating on this question blocks the script from proceeding to production.

---

## 3. Originality Scoring Dimensions

Originality is measured across 9 dimensions. Each dimension produces a score from 0.0 to 1.0. The aggregate originality score is the weighted mean of all 9 dimension scores. Default weights are equal (1/9 each) in V1.

Score thresholds apply uniformly across dimensions:
- **PASS:** score >= 0.60
- **REVIEW:** score 0.40–0.59 (requires human approval to proceed)
- **BLOCK:** score < 0.40 (cannot proceed without rewrite)

The aggregate score must meet the `originality_block` threshold (default 0.40) to proceed. Individual dimension scores do not independently block unless they fall into BLOCK range.

Override mechanism: any REVIEW or BLOCK score may be manually overridden by the operator with a written justification. Hard blocks (from spec section 18.3) cannot be overridden via the scoring override path.

---

### Dimension 1 — Lexical Novelty

**What is measured:** How different the vocabulary and phrasing in the opening paragraph is from the openings of recent scripts.

**How it is measured (V1 heuristic):** Extract unigrams and bigrams from the first 75 words of the new script. Compare against a merged token pool from the first 75 words of each of the last `pillar_diversity_window` scripts. Score = 1 - (overlap tokens / total tokens in new script opening). Pure text comparison, no embedding required in V1.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** REVIEW and BLOCK may be overridden with written justification. A genuinely strong opening that reuses similar setup language for editorial reasons (e.g., a series) may justify override.

---

### Dimension 2 — Framing Novelty

**What is measured:** Whether the thesis pattern — the way the central argument is set up — differs from recent scripts.

**How it is measured (V1 heuristic):** Classify each script's thesis using a small taxonomy of framing types (e.g., contrast_reveal, hidden_cost, systemic_effect, historical_parallel, population_impact, mechanism_expose). Compare the framing type of the new script against the last N scripts. Score = 1.0 if the framing type has not appeared in the last 3 scripts; 0.6 if it appeared once; 0.3 if it appeared more than once.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** Allowed with justification. Repeated framing types may be acceptable if the topic is structurally different enough.

---

### Dimension 3 — Structural Novelty

**What is measured:** Whether the beat plan — the sequence of narrative segments and their timing distribution — differs from recent scripts.

**How it is measured (V1 heuristic):** Extract the beat sequence labels from the script's beat plan (e.g., [hook, context, mechanism, consequence, cta]). Compare the sequence against the last N beat sequences. Score = 1.0 if no match; decrease by 0.2 for each script in the window with an identical sequence; floor at 0.0.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** Allowed. Some beat structures are strong enough to reuse deliberately — a series format, for example.

---

### Dimension 4 — Pillar Diversity

**What is measured:** Whether the channel is distributing content across editorial pillars or clustering in one pillar.

**How it is measured (V1 heuristic):** Count the pillar assignment of each of the last `pillar_diversity_window` uploaded videos. The diversity score = 1 - (count of most frequent pillar / total videos in window). A channel that posts 10 of 10 recent videos from the same pillar scores 0.0. A perfectly distributed 8-pillar channel scores ~0.88.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** Allowed with justification. A deliberate pillar series run may accept low diversity temporarily.

---

### Dimension 5 — Title Pattern Novelty

**What is measured:** Whether the title formula is distinct from recent titles.

**How it is measured (V1 heuristic):** Extract the structural template of the title by replacing proper nouns and topic-specific terms with slots. Compare the resulting template string against the templates of the last N titles. Score = 1.0 if no template match; 0.5 if one match; 0.0 if more than one match in the window.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** Allowed. Intentional series titling may reuse a formula.

---

### Dimension 6 — Hook Novelty

**What is measured:** Whether the hook type and opening phrase are distinct from recent hooks.

**How it is measured (V1 heuristic):** Classify the hook type (question, statement_challenge, statistic_drop, scenario_open, contradiction) and extract the first 15 words. Compare hook type and opening phrase against the last N hooks. Score = 1.0 if both type and phrase are novel; 0.5 if type matches but phrase does not; 0.2 if both match; 0.0 if phrase overlap exceeds 0.75.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** Allowed with justification.

---

### Dimension 7 — Visual Composition Novelty

**What is measured:** Whether the scene structure plan differs from recent asset plans.

**How it is measured (V1 heuristic):** Extract the sequence of scene types from the asset plan (e.g., [text_card, illustration, data_viz, portrait, text_card]). Compare against the last N scene type sequences. Score = 1.0 if no structural match; decrease by 0.2 per matching scene type sequence; floor at 0.0.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** Allowed with justification.

---

### Dimension 8 — Thesis Specificity

**What is measured:** How specific and verifiable the central claim of the script is.

**How it is measured (V1 heuristic):** Score the thesis on a 5-point rubric:
- 1.0: Thesis names a specific mechanism, a specific affected population, a measurable outcome, and a timeframe
- 0.8: Thesis names mechanism and population but not outcome or timeframe
- 0.6: Thesis names mechanism but is vague on population and outcome
- 0.4: Thesis is category-level ("AI affects jobs") with no mechanism
- 0.0: Thesis is purely declarative with no verifiable content ("AI is changing everything")

The LLM critic assigns this score as part of the critic pass and provides a one-line justification.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** Allowed with justification for stylistic cases where specificity is deliberately withheld for dramatic structure.

---

### Dimension 9 — Consequence Specificity

**What is measured:** How concrete and grounded the consequence framing is throughout the script — not just in the thesis but in every causal claim.

**How it is measured (V1 heuristic):** The LLM critic identifies every causal claim in the script and scores each on a binary: specific consequence named (1) or vague implication stated (0). Dimension score = count of specific consequences / total consequence claims. A script with 4 causal claims where 3 are specific scores 0.75.

**Thresholds:** PASS >= 0.60 | REVIEW 0.40–0.59 | BLOCK < 0.40

**Override:** Allowed with justification.

---

## 4. Editorial Delta Rule

Two consecutive Shorts may not ship if they share any two or more of the following five dimensions of similarity. If any single dimension reaches hard-match (identical pattern), a rewrite is required regardless of other scores.

### Checked Dimensions

**Opening line pattern:** Same rhetorical device used to open (question, contradiction, statistic, scenario). Hard match = same device with trigram overlap >= 0.75 in the first sentence.

**Core claim:** Same central assertion — identified by comparing the thesis statement extracted from each script. Hard match = semantic near-duplicate as judged by the critic prompt comparing the two thesis statements.

**Pacing template:** Same segment timing distribution. Hard match = same beat sequence label list in the same order.

**Visual style template:** Same visual metaphor class (e.g., data_horror, quiet_corporate, protest_footage_aesthetic, whiteboard_explainer). Hard match = same class assigned to both asset plans.

**Thumbnail wording template:** Same word formula extracted from the thumbnail headline. Hard match = same structural template string.

### Pivot Strategies

When similarity is detected, the system must force a pivot before allowing the second script to proceed. The operator selects or the system recommends one of four pivot strategies from spec section 17.4:

**Pivot 1 — Pillar Swap:** Move the new video to a different editorial pillar. The topic may remain adjacent, but the pillar assignment forces a reframing of the angle and consequence.

**Pivot 2 — Frame Inversion:** Keep the topic, invert the framing type. If the previous video used a contrast_reveal structure, the new one must use a mechanism_expose or population_impact structure. The critic pass verifies the inversion is substantive, not cosmetic.

**Pivot 3 — Specificity Escalation:** Keep the topic and framing, but force the script to go one level deeper in specificity — naming more specific mechanisms, a narrower affected population, or a more recent or documented consequence. This pivot is appropriate when the topic is strong but the script is too generic relative to the previous video.

**Pivot 4 — Format Change:** Change the narrative format entirely. If the previous video was an analytical explainer, the new one becomes a case study, a timeline reconstruction, or a comparison format. Format change forces structural novelty regardless of topic similarity.

---

## 5. Critic Pass Requirements

Every script must pass a structured critic pass before it advances to the media pipeline. The critic is an LLM prompt that receives the full script, beat plan, and title, and returns structured evaluation on the following five questions from spec section 17.5.

Each question receives:
- A **rating:** PASS / CONCERN / FAIL
- A **written note:** one to three sentences explaining the rating

A FAIL on any single question triggers a mandatory rewrite. The rewrite service incorporates the critic's written note as a directive. After rewrite, the critic pass runs again. This loop repeats up to `max_auto_rewrites` times (default 3). If the script still fails after the maximum rewrites, the package is escalated to human review.

A CONCERN on any question does not block but is surfaced to the human reviewer in the QA workspace.

### Question 1: Does this sound mass-produced?

Evaluates whether the script has distinguishing editorial voice or whether it reads as interchangeable with any AI-generated content on the same topic. The critic looks for: templated sentence structures, filler transitions, overuse of hedging language ("could," "might," "in some cases"), and absence of a specific point of view.

### Question 2: Is the hidden consequence actually specific?

Evaluates whether the consequence named in the script is concrete enough to be remembered and acted on. The critic checks that the consequence is not a restatement of the premise and that it names something the viewer could not have inferred without watching.

### Question 3: Would a viewer feel this channel has a point of view?

Evaluates whether the script expresses a discernible editorial stance — not political neutrality avoidance, but a specific analytical perspective on why the AI side effect under discussion matters and to whom. A script that presents "both sides equally" without committing to a thesis fails this question.

### Question 4: Is there enough added value for platform originality expectations?

Evaluates whether the script provides informational, analytical, or emotional value beyond what is available from a simple Google search or a one-paragraph summary. The critic checks for: original synthesis of multiple sources, non-obvious connections between facts, or a framing that recontextualizes known information.

### Question 5: What makes this different from hundreds of generic AI Shorts?

The critic must name at least one specific differentiating factor — topic angle, specificity level, population named, mechanism described, or format choice. A response that cannot name a differentiating factor results in a FAIL.

---

## 6. Publish Blocker Conditions

These six conditions from spec section 18.3 block a package from advancing to the export stage. Hard blocks cannot be overridden by any operator action. Override-allowed blocks require a written justification entered by the operator before the block is released.

### B-01 — Originality Score Below Threshold

**Condition:** The aggregate originality score across all 9 dimensions is below `originality_block` (default 0.40).

**Detection:** Calculated by the originality guard service after script generation and asset plan creation.

**Blocking threshold:** 0.40 aggregate (configurable, range 0.20–0.60).

**Override:** Allowed. Operator must enter a written justification. Justification is stored in the QARun record.

---

### B-02 — Reused Risk Score Above Threshold

**Condition:** The reused-content risk score — based on asset provenance classification and structural similarity — exceeds `reused_risk_block` (default 0.70).

**Detection:** Calculated during asset provenance validation. Increments for external clips, stock footage without transformation record, and structural matches to external widely-distributed content.

**Blocking threshold:** 0.70 (configurable, range 0.50–0.90).

**Override:** Allowed with written justification.

---

### B-03 — Title and Script Overclaim Unsupported Facts

**Condition:** The critic pass or QA scoring service identifies a factual claim in the script or title that is stated as established fact but is not supported by a source record in the provenance file.

**Detection:** QA scoring category "factual integrity" checks each specific factual claim against the provenance.json source list. Unsourced specific claims are flagged.

**Blocking threshold:** Any single unsupported specific factual claim.

**Override:** Hard block. Cannot be released until the claim is either sourced (provenance record added) or revised to remove the unsupported specificity.

---

### B-04 — Visual Package Too Similar to Recent Uploads

**Condition:** The asset plan's scene structure and visual style classification match a recent upload above the `similarity_review` threshold.

**Detection:** Visual composition novelty score (dimension 7) falls into BLOCK range, or the editorial delta check finds a visual style hard match against the immediately preceding upload.

**Blocking threshold:** Visual composition novelty score < 0.40, or hard match on visual style template with immediately preceding upload.

**Override:** Allowed with written justification.

---

### B-05 — Missing Provenance Records

**Condition:** The export package cannot be assembled because one or more assets do not have a provenance record in the system.

**Detection:** The export builder validates that every asset_id referenced in the VideoProject has a corresponding AssetRecord with a source field populated.

**Blocking threshold:** Any asset with missing provenance.

**Override:** Hard block. Provenance record must be created before the block clears.

---

### B-06 — Technical Render Corruption

**Condition:** The rendered video file fails integrity checks — duration mismatch, corrupted container, audio sync failure, or resolution outside spec.

**Detection:** FFmpeg output validation step checks duration against script timing, audio sync, container integrity, and output resolution.

**Blocking threshold:** Any failed integrity check.

**Override:** Hard block. File must be re-rendered and pass all checks before the block clears.

---

## 7. Human Review Checklist

Before a reviewer approves a package for export, they must answer all six questions affirmatively. The review UI presents this checklist and requires each item to be checked YES before the Approve button is available. The checklist answers are stored in the QARun record with a timestamp and the reviewer identity.

- [ ] The script has a specific, original thesis that I could not find verbatim in a Google search
- [ ] Every factual claim in the script either has a source record or is clearly framed as analysis or inference
- [ ] The hook would make me stop scrolling if I were not already thinking about this topic
- [ ] This video looks and sounds different enough from the last three uploads that a viewer would not suspect template use
- [ ] The thumbnail and title do not promise more than the video delivers
- [ ] I am comfortable with this video representing the channel's editorial standard

---

## 8. Threshold Definitions

All thresholds are configurable via environment variables. Changes take effect on next application start. Threshold values are validated against the min/max range on load; out-of-range values cause a startup error.

| Threshold | Default | Min | Max | Description |
|---|---|---|---|---|
| originality_block | 0.40 | 0.20 | 0.60 | Aggregate originality score below which a package is blocked from proceeding |
| reused_risk_block | 0.70 | 0.50 | 0.90 | Reused-content risk score above which a package is blocked |
| similarity_review | 0.75 | 0.50 | 0.95 | Pairwise similarity score above which a review flag is triggered |
| max_auto_rewrites | 3 | 1 | 5 | Maximum number of automatic rewrites before human escalation is required |
| pillar_diversity_window | 10 | 5 | 20 | Number of recent uploaded videos examined for pillar distribution scoring |
| consecutive_delta_check | 2 | 1 | 5 | Number of consecutive videos checked in the editorial delta comparison |

Environment variable names:

```
ORIGINALITY_BLOCK_THRESHOLD=0.40
REUSED_RISK_BLOCK_THRESHOLD=0.70
SIMILARITY_REVIEW_THRESHOLD=0.75
MAX_AUTO_REWRITES=3
PILLAR_DIVERSITY_WINDOW=10
CONSECUTIVE_DELTA_CHECK=2
```
