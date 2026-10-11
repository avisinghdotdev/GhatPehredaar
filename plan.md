# Ghat Pehredaar (घाट पहरेदार) — build plan

Bhopal Impact Lab 2026, Track 2 "Visarjan Ghat Watch". One tool, one user: the Bhopal Municipal
Corporation officer who plans Durga visarjan (20 Oct 2026) and decides where to send cleaning,
aeration and testing. Problem pack: https://github.com/Vishal4742/bhopal-impact-lab-2026-problem-statements

Hard deadline: public GitHub repo by **17:00 IST, Sunday 11 Oct 2026**. Code is written from 10:15
today; the Palisade scaffold is reused only for tooling (uv, pnpm, just, pre-commit, lint, Docker).

## What the tool does (v1, today)

For each of the 7 Bhopal ghats, from MPPCB's before / during / one-week-after samples (2023–2025):

1. **Pass/fail against CPCB Class B** (outdoor bathing): DO ≥ 5 mg/l, BOD ≤ 3 mg/l, pH 6.5–8.5.
2. **Three questions, three officer levers**
   - *Already failing before immersion?* → aerate before the festival, or do not use the ghat.
   - *How hard is the hit during immersion?* → cranes, liners, crowd control on the day.
   - *Recovered one week after?* → cleanup crews and re-testing.
3. **Rank** by share of failing readings; show the rank range across 1,000 resamples of the six
   festivals so a shaky middle order is shown as shaky.
4. **Every number links to the MPPCB PDF page** it was printed on (`source_page`).
5. **Gaps shown as gaps**: not-sampled cells, ghats with no Durga 2025 table, total coliform never
   tested at any ghat (so Class B cannot be certified), 2025 metals printed at the detection limit.
6. **Hindi + English everywhere**: UI toggle, generated plain-language reason per ghat, and a
   one-page forwardable brief written by Claude from the computed evidence, with a validator that
   rejects any number not present in the data.

Not built today, listed in README under "what does not work yet": PDF ingest agent for new MPPCB
reports, page-level highlight inside the PDF, metals against a reference limit, map, Docker
run, Azure deployment, custom domain.

## Stack

- `api/` FastAPI + pandas, Python 3.13, uv. Loads `data/*.csv` at startup, computes the ranking,
  serves the PDFs, serves the cached brief. `python -m ghat_pehredaar_api.brief` generates the
  brief with Claude (`ANTHROPIC_API_KEY` from `.env`, never in the repo).
- `web/` React Router 8 (SPA, prerender) + Vite + TypeScript strict + Tailwind v4. Generated
  OpenAPI client, TanStack Query. One route.
- `data/` the organisers' CSVs, data dictionary and the three MPPCB PDFs (public data, linked).

## Timeline (IST)

| Time | Step |
|---|---|
| 14:15–14:35 | plan.md, `git init`, strip Palisade app code and infra, rename packages, CLAUDE.md |
| 14:35–15:30 | API: scoring module, endpoints, OpenAPI export, generated client |
| 15:30–16:15 | SPA: ranking table, evidence drawer with page links, coverage matrix, language toggle, brief panel |
| 16:15–16:30 | Brief generation with validator; README with 5-step run, what works / does not |
| 16:30–16:45 | End-to-end run, fixes, screen recording (user) |
| 16:45–17:00 | User creates public repo `GhatPehredaar`, pushes, submits the form |

## After the deadline

1. Install WSL + Docker Desktop; restore `hadolint` pre-commit hook; `just up` must pass.
2. Azure: new workload `ghatpehredaar` on the Palisade Bicep pattern (bootstrap + env stacks,
   shared registry `cravisingh`, Key Vault for `ANTHROPIC_API_KEY`), Cloudflare CNAME
   `ghatpehredaar.avisingh.dev`, release workflow on `main`.
3. Reader agent: new MPPCB PDF → checked rows with page refs, site-name mapping, impossible-value
   flags. Auditor agent: re-open each cited page and confirm the printed value.
4. Statewide file (21,600 rows, ~200 sites) as background percentiles after outlier filtering.
5. Citizen reports: a WhatsApp or web intake where a citizen describes damage, smell or dumping at
   a ghat; Claude classifies it to a ghat and a problem type, and it lands in the same officer
   view as a "field reports" column next to the lab readings. Kept out of the hackathon build on
   purpose: it is a second user and a second workflow, and acting on a report needs a live BMC
   system, which the rules forbid.

## Rules kept from the brief

Public data only. No live government systems. No personal data. No health claims. Missing data
is never shown as clean. MIT license. No secrets in the repo.
