```markdown
# Sway Leader Influence Dashboard — Take-Home

## Overview

This project prototypes a **Leader Influence Dashboard** for Sway (sway.co): a platform where people **“vote with” trusted leaders on specific topics**, and Sway **verifies registered voters** so leaders can demonstrate credible political leverage (not just social popularity).

**Constraint:** ~4 hours build time  
**Required stack:** TypeScript + Next.js (frontend)  
**Core philosophy:** **Influence ≠ popularity.** Influence is *deployable voting power* tied to real ballots and elections.

---

## What “Influence” Means on Sway

**Influence = credible voting power applied to specific ballot decisions + the movement’s ability to compound.**

A useful mental model:

> **Influence ≈ Verification × Context × Concentration × Timing × Growth**

- **Verification (Credibility):** verified registered voters (not anonymous likes)
- **Context:** overlap between verified supporters and **specific ballot items** (races/measures)
- **Concentration:** focused support beats diffuse support (by geography + election)
- **Timing:** elections soon matter more than elections far away
- **Growth:** movement compounding (supporters → verified → leaders; new jurisdictions unlocked)

---

## Data Sources

### 1) Mock Dataset (Primary)
JSON files representing one leader’s movement (main group ID: `4d627244-5598-4403-8704-979140ae9cac`):

- Groups + membership: `viewpoint_groups.json`, `profiles.json`, `profile_viewpoint_group_rels.json`
- People + verification: `persons.json`, `voter_verifications.json`
- Geography: `jurisdictions.json`, `voter_verification_jurisdiction_rels.json`
- Elections + ballots: `elections.json`, `ballot_items.json`, `ballot_item_options.json`
- Race/measure details: `races.json`, `offices.json`, `office_terms.json`, `candidacies.json`, `measures.json`, `parties.json`
- Target schema: `influence_targets.json`

**Key joins**
- Group members: `profile_viewpoint_group_rels → profiles`
- Where supporters vote: `profiles → persons → voter_verifications → voter_verification_jurisdiction_rels → jurisdictions`
- What’s on their ballot: `jurisdictions → ballot_items → races/measures`

### 2) Sway API 
**GraphQL:** `https://sway-production.hasura.app/v1/graphql` (JWT auth)

Use to enrich the dashboard with:
- broader electoral context (CivicEngine)
- coalition opportunities (adjacent leaders)
- benchmark comparisons (peers)

---

## Metrics (3–5) that Matter Most

These metrics are chosen because they are **computable from the dataset**, **actionable**, and map directly to Sway’s “influence ≠ popularity” thesis.

1) **Verified Voter Base + Growth Rate**  
   *How much credible voting power exists, and is it growing?*

2) **Jurisdiction Concentration Index** (HHI + top jurisdictions)  
   *Where is influence geographically deployable (dense vs diffuse)?*

3) **Ballot Exposure by Race/Measure**  
   *Which specific decisions can this leader influence (and how many verified voters are eligible to vote on each)?*

4) **Urgency-Weighted Influence** (time-decay + office-level leverage heuristic)  
   *What matters now vs later? Prioritize nearer elections and (heuristically) lower-turnout local races.*

5) **Network Expansion Signal**  
   *Is the movement compounding (supporters becoming leaders, unlocking new jurisdictions)?*

---

## What the Dashboard Should Enable (Insights → Actions)

The dashboard should be **prescriptive, not just descriptive**. For each insight, it should recommend a concrete next step.

Examples:
- **High leverage + near election:** “Focus on [Race/Measure] — publish voter guide + run targeted onboarding in [Jurisdiction].”
- **High concentration + low verification rate:** “Run a verification push in [Top Jurisdiction] to convert latent support into influence.”
- **Influence is diffuse:** “Pick 1–2 priority jurisdictions to concentrate growth before the next election window.”
- **Weak network effect:** “Recruit chapter leaders from top jurisdictions; provide a template guide they can rebroadcast.”

---

## Out of Scope (and Why)

- **Election outcome forecasting / ‘who will win’** — requires turnout history + introduces forecasting liability.
- **Persuasion effectiveness** — needs messaging and engagement telemetry not in the dataset.
- **Individual-level microtargeting** — privacy-sensitive; MVP focuses on aggregate influence.
- **Cross-leader competitive ranking** — requires multi-leader datasets and careful neutrality framing.

---

## Implementation Plan

### Architecture: Static-first, API-enhanced 
- **No database** for the take-home: compute analytics **in-memory** from JSON on the server.
- One endpoint returns a typed `DashboardModel`.
- API enrichments are best-effort and non-blocking (graceful degradation).

### Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui (UI components)
- Recharts (charts)

---

## Core Computations (Sketch)

### Verified Voter Base
- Join `profile_viewpoint_group_rels → profiles → persons → voter_verifications`
- `current = count(distinct verified voters)`
- `verificationRate = verified / total supporters`
- `trend = bucket by created_at if available; otherwise explain bucketing approach`

### Jurisdiction Concentration (HHI)
- Count verified voters per jurisdiction
- `HHI = Σ (share_j²)` where `share_j = count_j / total_verified`

### Ballot Exposure
- For each ballot item, count verified voters in jurisdictions where it appears
- Add:
  - **urgency** (days until election)
  - **office level multiplier** (local/state/federal) as a simple leverage heuristic
  - **leverageScore = exposure × urgencyWeight × levelMultiplier**

### Network Expansion
- Supporters in main group who appear as leaders of other groups
- Count derivative leaders + new jurisdictions unlocked by their groups

---

## File Structure

```

sway-dashboard/
├── app/
│   ├── api/dashboard/route.ts
│   └── page.tsx
├── lib/
│   ├── data-loader.ts
│   ├── metrics/
│   │   ├── verified-voters.ts
│   │   ├── jurisdictions.ts
│   │   ├── ballot-exposure.ts
│   │   ├── network-expansion.ts
│   │   └── actions.ts
│   ├── sway-api.ts 
│   └── types.ts
├── components/dashboard/…
├── data/ (JSON files)
└── README.md (Part 3: Evolution & tradeoffs)

````

---

## UI Layout (High-level)

1) **This Week’s Focus** (top 1–3 recommended actions)
2) **Overview KPIs** (verified voters, verification rate, concentration, network)
3) **Growth Trend** (verified voters over time)
4) **Where Influence Lives** (top jurisdictions + HHI)
5) **Upcoming Elections / Ballot Items** (ranked by leverage score)
6) Optional: API-enhanced panels (coalitions, benchmarks)

---

## Environment Variables (Optional)

```env
SWAY_API_KEY=...
````

---

## Success Criteria

* Metrics are **credible, data-driven, and tied to ballots/elections**
* The dashboard produces **clear, prioritized actions**
* Code is **type-safe, modular, and readable**
* Tradeoffs and scale considerations are documented (100k supporters / 100k leaders)

```

::contentReference[oaicite:0]{index=0}
```
