"""Write data/brief.json: a bilingual officer brief from the computed ranking.

Claude writes the text from a compact evidence table; a validator then rejects any number in the
brief that is not present in that evidence, so the brief can never carry an invented figure.
"""

import json
import os
import re
import sys
from datetime import UTC, datetime

import anthropic

from ghat_pehredaar_api.data import BRIEF_JSON, load_readings
from ghat_pehredaar_api.scoring import GhatRanking, Ranking, rank_ghats

MODEL = "claude-sonnet-5-5"
VISARJAN_DATE = "20 October 2026"
# Numbers the brief may use that are not readings: the date, the limits, the material-change step.
CONTEXT_NUMBERS = {20, 2026, 5, 3, 6.5, 8.5, 1, 7, 2023, 2025, 189, 17, 11}

SYSTEM = """You write a one-page brief for the Bhopal Municipal Corporation officer who plans Durga visarjan.
Rules:
- Plain words a busy officer reads in two minutes. Short sentences.
- Use ONLY numbers that appear in the evidence JSON. No percentages, no averages you compute yourself, no new figures.
- Never claim health effects. Say what the readings show against the CPCB Class B bathing limit (oxygen at least 5 mg/l, BOD at most 3 mg/l, pH 6.5 to 8.5).
- Cite every reading you quote as (MPPCB report YEAR, p. PAGE) using the page numbers in the evidence.
- Say plainly where data is missing, using the notes given. Never treat missing as clean.
- Order ghats worst first. For each: one line on what the data shows, one line on what to do before 20 October 2026 (aerate or do not use / cranes, liners, crowd control / cleanup and re-test).
- End with one line: this brief is evidence for the Idol Immersion Management Plan the National Green Tribunal (OA 189/2026, hearing 17 November 2026) asked for.
- Hindi in Devanagari script with Western digits (0-9). Each text under 260 words. Use line breaks between ghats.
- Plain text only: no markdown, no asterisks, no hash signs. The brief is pasted into WhatsApp as is.
- Output format, nothing else: a line `===EN===`, the English brief, a line `===HI===`, the Hindi brief."""


def compact(ghat: GhatRanking) -> dict[str, object]:
    def worst(parameter: str, pick_min: bool) -> dict[str, object] | None:
        evidence = next(p for p in ghat.parameters if p.parameter == parameter)
        readings = [
            (r.value, e.year, e.festival, phase, r.source_page)
            for e in evidence.events
            for phase, r in (("pre", e.pre), ("during", e.during), ("after", e.after))
            if r is not None and r.value is not None
        ]
        if not readings:
            return None
        value, year, festival, phase, page = (
            min(readings) if pick_min else max(readings)
        )
        return {
            "value": value,
            "year": year,
            "festival": festival,
            "phase": phase,
            "page": page,
        }

    gaps = [
        f"{c.festival} {c.year}: no table"
        for c in ghat.coverage
        if not (c.pre or c.during or c.after)
    ]
    gaps += [
        f"{c.festival} {c.year}: only {'/'.join(p for p, s in (('pre', c.pre), ('during', c.during), ('after', c.after)) if s)} sampled"
        for c in ghat.coverage
        if (c.pre or c.during or c.after) and not (c.pre and c.during and c.after)
    ]
    return {
        "rank": ghat.rank,
        "ghat": ghat.site,
        "water_body": ghat.water_body,
        "failing_readings": ghat.failing,
        "total_readings": ghat.readings,
        "before_immersion_failing": f"{ghat.chronic.failing} of {ghat.chronic.total}",
        "festivals_with_clear_worsening_during": f"{ghat.shock.failing} of {ghat.shock.total}",
        "one_week_after_still_failing": f"{ghat.recovery.failing} of {ghat.recovery.total}",
        "lowest_oxygen_mg_l": worst("Dissolved oxygen", pick_min=True),
        "highest_bod_mg_l": worst("BOD", pick_min=False),
        "gaps": gaps,
    }


def evidence(ranking: Ranking) -> dict[str, object]:
    return {
        "durga_visarjan": VISARJAN_DATE,
        "limit": "CPCB Class B: oxygen >= 5 mg/l, BOD <= 3 mg/l, pH 6.5-8.5",
        "ghats_worst_first": [compact(g) for g in ranking.ghats],
        "notes": [n.en for n in ranking.notes],
    }


def numbers_in(payload: object) -> set[float]:
    text = json.dumps(payload, ensure_ascii=False)
    return {float(n) for n in re.findall(r"\d+(?:\.\d+)?", text)}


def unknown_numbers(text: str, allowed: set[float]) -> list[str]:
    return sorted(
        {n for n in re.findall(r"\d+(?:\.\d+)?", text) if float(n) not in allowed}
    )


def ask(client: anthropic.Anthropic, prompt: str) -> dict[str, str]:
    message = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(block.text for block in message.content if block.type == "text")
    match = re.search(r"===EN===\s*(.*?)\s*===HI===\s*(.*)", text, re.DOTALL)
    if match is None:
        raise ValueError(f"brief missing the ===EN=== / ===HI=== markers: {text[:200]}")
    return {
        "en": match.group(1).strip(),
        "hi": match.group(2).strip().removesuffix("```").strip(),
    }


def main() -> int:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print(
            "ANTHROPIC_API_KEY is not set; put it in .env and run `just brief`.",
            file=sys.stderr,
        )
        return 1
    ranking = rank_ghats(load_readings())
    table = evidence(ranking)
    allowed = numbers_in(table) | CONTEXT_NUMBERS
    client = anthropic.Anthropic()
    prompt = "Evidence JSON:\n" + json.dumps(table, ensure_ascii=False, indent=1)
    brief = ask(client, prompt)
    bad = {lang: unknown_numbers(text, allowed) for lang, text in brief.items()}
    if any(bad.values()):
        print(
            f"first draft used numbers not in the evidence: {bad}; asking for a corrected draft"
        )
        correction = (
            f"{prompt}\n\nYour previous draft used these numbers that are NOT in the evidence: "
            f"{json.dumps(bad)}. Rewrite both texts using only numbers from the evidence."
        )
        brief = ask(client, correction)
        bad = {lang: unknown_numbers(text, allowed) for lang, text in brief.items()}
        if any(bad.values()):
            print(f"brief rejected, numbers not in evidence: {bad}", file=sys.stderr)
            return 1
    BRIEF_JSON.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
                "model": MODEL,
                "en": brief["en"],
                "hi": brief["hi"],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"wrote {BRIEF_JSON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
