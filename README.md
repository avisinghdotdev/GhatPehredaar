# Ghat Pehredaar · घाट पहरेदार

**Which Bhopal ghat needs help before Durga visarjan on 20 October 2026.**

Bhopal Impact Lab 2026 · Track 2, Visarjan Ghat Watch · Claude Impact Lab × Cerebras Café Compute, 11 October 2026.

- **Team:** Ghat Pehredaar
- **Members:** Avi Singh
- **Track:** 2, Visarjan Ghat Watch
- **The one user:** the Bhopal Municipal Corporation officer who plans Durga visarjan at the ghats and decides where to send extra cleaning, aeration and water testing before 20 October.
- **Live:** https://ghatpehredaar.avisingh.dev

## What it does

Every Ganesh and Durga festival, the MP Pollution Control Board samples the water at Bhopal's seven immersion ghats three times: before immersion, during, and one week after. The results sit in 90 to 120 page PDFs. Ghat Pehredaar reads the organisers' extraction of those PDFs (1,524 readings, 2023 to 2025) and gives the officer:

1. **A ranked list of the seven ghats**, worst first, by the share of oxygen, BOD and pH readings that break the CPCB Class B (outdoor bathing) limit: dissolved oxygen 5 mg/l or more, BOD 3 mg/l or less, pH 6.5 to 8.5.
2. **Three questions per ghat, each tied to one lever the officer controls:**
   - *Already failing before immersion?* Aerate before the festival, or do not use the ghat.
   - *Clearly worse during immersion* (oxygen down or BOD up by 1 mg/l or more)? Cranes, liners, crowd control on the day.
   - *Still failing one week after?* Cleanup crews and re-test.
3. **A plain-language reason for every rank**, in Hindi and English.
4. **Every number linked to the MPPCB report page it was printed on.** Click a reading and the original PDF opens at that page.
5. **A rank range** from 1,000 resamples of the six festivals, so a shaky middle order is shown as shaky.
6. **Gaps shown as gaps:** not-sampled cells, ghats with no Durga 2025 table, and the notes below.
7. **A one-page brief to forward**, in Hindi and English, written by Claude from the computed evidence. A validator rejects any number in the brief that is not present in the data, so the brief can never carry an invented figure.

## Run it (5 steps)

Needs git, [uv](https://docs.astral.sh/uv/) and Node 24 (pnpm is installed by step 2).

1. `git clone https://github.com/avisinghdotdev/GhatPehredaar.git && cd GhatPehredaar`
2. `npm install -g pnpm@11.27.1 && uv sync && pnpm --dir web install`
3. `pnpm --dir web run build`
4. `uv run --frozen uvicorn ghat_pehredaar_api.main:app --port 8000`
5. Open http://localhost:8000 (Hindi by default; the button top right switches to English).

With [just](https://github.com/casey/just): `just init`, `just build-web`, `just api`. For live reload use `just api` and `just web` in two terminals and open http://localhost:5173.

To regenerate the brief: copy `.env.example` to `.env`, set `ANTHROPIC_API_KEY`, run `just brief`. The repo ships a generated `data/brief.json` so the tool works without a key.

Container: `docker compose up --build` serves everything on http://localhost:8000. Deploy to Azure Container Apps with `just deploy` (builds in Azure Container Registry, no local Docker needed).

## What works and what does not

Works:

- Ranking, three-axis verdicts, bilingual reasons, rank ranges, coverage grid, data notes, page links into the three MPPCB PDFs, bilingual brief with number validation, Hindi/English toggle.
- API tests (`uv run pytest`) check the totals against the problem statement: 42 of 116 oxygen readings below 5 mg/l, 100 of 112 BOD readings above 3 mg/l.

Does not work yet:

- **Ingesting a new MPPCB PDF.** The tool reads the organisers' CSV. A reader agent that turns the next report (Durga 2026, due in November) into checked rows with page references is the next step.
- **Highlighting the exact cell inside the PDF.** Links open the right page; the cell is not highlighted.
- **Heavy metals against a limit.** CPCB Class B sets no metal limit, so metals are shown as context only.
- **Statewide context.** The 21,600-row statewide file is not used yet; it has impossible values (dissolved oxygen up to 432 mg/l) and 879 unreadable site names that need the reader agent first.
- **A map of the ghats.**

## What the data cannot tell you

- **Total coliform**, the fourth Class B criterion, was never tested at any ghat in these reports. No ghat can be certified Class B from this data.
- **Units are not printed** in the reports; the standard units from the data dictionary are assumed.
- **2025 metal readings print the lab's detection limit** (chromium 0.03, lead 0.031, copper 0.018 mg/l) as if measured. The same figures appear as "<0.031" and "<0.018" in MPPCB's Upper Lake monthly report. The tool marks them "printed at detection limit".
- **Bairagarh and Malikhedi have no Durga 2025 table**, and in Ganesh 2025 only the during-immersion sample exists: the 2025 report (p. 92) notes the temporary kunds were not built before and were dismantled after immersion.
- **"Rani Kamlapati ghat / Kamla Park kund" may be two places.** Ganesh tables say Kamla Park kund, Durga tables say Lower Lake ghat.
- **No health claims.** The tool reports readings against the bathing limit and nothing more.

## Data

All public, from the organisers' pack at https://github.com/Vishal4742/bhopal-impact-lab-2026-problem-statements (track 2):

- `data/bhopal_ghats_2023_2025.csv`, `data/sample_bhopal_2025.csv`, `data/mp_immersion_sites_2023_2025.csv`, `data/cpcb_water_quality_criteria.csv`, `data/DATA_DICTIONARY.md`
- `data/mppcb-visarjan-report-2023.pdf` ([source](https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf)), `-2024.pdf` ([source](https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf)), `-2025.pdf` ([source](https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf))
- CPCB water-quality criteria: https://cpcb.gov.in/water-quality-criteria/

Context used in the brief: the National Green Tribunal (Central Zone) order of 1 October 2026 in OA 189/2026 directing compliance with CPCB idol-immersion guidelines for Bhopal's lakes, next hearing 17 November 2026 ([Hitavada](https://www.thehitavada.com/Encyc/2026/10/1/ngt-orders-to-strictly-comply-with-cpcb-guidelines-on-idol-immersions.html)).

## Method, in one paragraph

Each reading is compared with its Class B limit. A ghat's rank is the share of failing oxygen, BOD and pH readings across all phases. The three axes use the pre-immersion readings (chronic), the during-minus-pre change in oxygen and BOD per festival (shock, material at 1 mg/l), and the one-week-after readings of oxygen and BOD (recovery). Rank uncertainty comes from resampling each ghat's festivals with replacement 1,000 times and re-ranking. Readings marked BDL are below the lab's detection limit and are never treated as zero or as missing. There is no trained model: with 7 ghats and 6 festivals, transparent arithmetic the officer can check beats a model nobody can audit.

## Stack

FastAPI + pandas (Python 3.13, uv) and React Router 8 + Vite + TypeScript + Tailwind (pnpm). One container serves both. Claude (`claude-sonnet-5-5`) writes the brief; the API key lives only in `.env`.

## License

MIT, see `LICENSE`.
