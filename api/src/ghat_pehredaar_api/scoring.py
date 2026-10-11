"""Scores the Bhopal ghats against CPCB Class B and ranks them with resampling uncertainty.

Three questions per ghat, each tied to one lever the visarjan officer controls:
chronic (failing before immersion: aerate or skip), shock (worse during immersion: cranes, liners,
crowd control), recovery (still failing one week after: cleanup and re-test).
"""

from typing import Literal

import numpy as np
import pandas as pd
from pydantic import BaseModel

from ghat_pehredaar_api.data import (
    CLASS_B_LIMITS,
    DETECTION_LIMIT_AS_VALUE,
    SHOWN_PARAMETERS,
    Limit,
)

Verdict = Literal["fail", "warn", "pass", "unknown"]
BOOTSTRAP_ITERATIONS = 1000
MATERIAL_CHANGE_MG_L = 1.0
LIMITED = list(CLASS_B_LIMITS)


class Reading(BaseModel):
    value: float | None
    printed: str
    flag: str | None
    fails: bool | None
    detection_limit_as_value: bool
    source_page: int


class EventReadings(BaseModel):
    year: int
    festival: str
    pre: Reading | None
    during: Reading | None
    after: Reading | None


class ParameterEvidence(BaseModel):
    parameter: str
    unit: str
    limit: Limit | None
    readings: int
    failing: int | None
    events: list[EventReadings]


class Axis(BaseModel):
    verdict: Verdict
    failing: int
    total: int
    median_do_change: float | None = None
    median_bod_change: float | None = None


class Coverage(BaseModel):
    year: int
    festival: str
    pre: bool
    during: bool
    after: bool


class GhatRanking(BaseModel):
    rank: int
    rank_low: int
    rank_high: int
    site: str
    water_body: str
    site_confidence: str
    readings: int
    failing: int
    fail_share: float
    chronic: Axis
    shock: Axis
    recovery: Axis
    parameters: list[ParameterEvidence]
    coverage: list[Coverage]
    reason_en: str
    reason_hi: str


class Note(BaseModel):
    key: str
    en: str
    hi: str


class Ranking(BaseModel):
    rows: int
    years: list[int]
    limits: list[Limit]
    ghats: list[GhatRanking]
    notes: list[Note]


def fails_limit(parameter: str, value: float) -> bool | None:
    limit = CLASS_B_LIMITS.get(parameter)
    return None if limit is None else limit.fails(value)


def rank_ghats(frame: pd.DataFrame) -> Ranking:
    scored = frame[frame["parameter"].isin(LIMITED) & frame["value"].notna()].copy()
    scored["fails"] = [
        CLASS_B_LIMITS[p].fails(v)
        for p, v in zip(scored["parameter"], scored["value"], strict=True)
    ]
    events = sorted(set(zip(frame["year"], frame["festival"], strict=True)))
    sites = sorted(frame["site"].unique())
    shares = {
        site: (
            int(scored.loc[scored["site"] == site, "fails"].sum()),
            int((scored["site"] == site).sum()),
        )
        for site in sites
    }
    order = sorted(sites, key=lambda s: (-shares[s][0] / shares[s][1], s))
    rank_bounds = bootstrap_rank_bounds(scored, sites)

    ghats: list[GhatRanking] = []
    for position, site in enumerate(order, start=1):
        site_rows = frame[frame["site"] == site]
        site_scored = scored[scored["site"] == site]
        failing, total = shares[site]
        chronic = chronic_axis(site_scored)
        shock = shock_axis(site_scored)
        recovery = recovery_axis(site_scored)
        low, high = rank_bounds[site]
        ghats.append(
            GhatRanking(
                rank=position,
                rank_low=low,
                rank_high=high,
                site=site,
                water_body=str(site_rows["water_body"].iloc[0]),
                site_confidence=str(site_rows["site_match_confidence"].iloc[0]),
                readings=total,
                failing=failing,
                fail_share=round(failing / total, 3),
                chronic=chronic,
                shock=shock,
                recovery=recovery,
                parameters=[
                    parameter_evidence(site_rows, parameter, events)
                    for parameter in SHOWN_PARAMETERS
                ],
                coverage=coverage(site_rows, events),
                reason_en=reason_en(failing, total, chronic, shock, recovery),
                reason_hi=reason_hi(failing, total, chronic, shock, recovery),
            )
        )
    return Ranking(
        rows=len(frame),
        years=sorted(int(y) for y in frame["year"].unique()),
        limits=list(CLASS_B_LIMITS.values()),
        ghats=ghats,
        notes=notes(frame, ghats),
    )


def bootstrap_rank_bounds(
    scored: pd.DataFrame, sites: list[str]
) -> dict[str, tuple[int, int]]:
    """Resample each ghat's festivals with replacement and re-rank; return 5th and 95th rank percentiles."""
    rng = np.random.default_rng(seed=20261011)
    per_site: list[tuple[np.ndarray, np.ndarray]] = []
    for site in sites:
        grouped = scored[scored["site"] == site].groupby(["year", "festival"])["fails"]
        per_site.append(
            (grouped.sum().to_numpy(dtype=float), grouped.count().to_numpy(dtype=float))
        )
    ranks = np.empty((BOOTSTRAP_ITERATIONS, len(sites)), dtype=int)
    for iteration in range(BOOTSTRAP_ITERATIONS):
        share = np.empty(len(sites))
        for index, (fails, counts) in enumerate(per_site):
            picks = rng.integers(0, len(counts), size=len(counts))
            share[index] = fails[picks].sum() / counts[picks].sum()
        ranks[iteration, np.argsort(-share, kind="stable")] = np.arange(
            1, len(sites) + 1
        )
    low = np.percentile(ranks, 5, axis=0)
    high = np.percentile(ranks, 95, axis=0)
    return {
        site: (round(float(low[i])), round(float(high[i])))
        for i, site in enumerate(sites)
    }


def verdict(failing: int, total: int) -> Verdict:
    if total == 0:
        return "unknown"
    if failing / total >= 0.5:
        return "fail"
    return "warn" if failing > 0 else "pass"


def chronic_axis(site_scored: pd.DataFrame) -> Axis:
    pre = site_scored[site_scored["phase"] == "pre"]
    failing, total = int(pre["fails"].sum()), len(pre)
    return Axis(verdict=verdict(failing, total), failing=failing, total=total)


def phase_changes(site_scored: pd.DataFrame, parameter: str, phase: str) -> pd.Series:
    """Per festival: `phase` value minus the pre-immersion value, where both exist."""
    rows = site_scored[site_scored["parameter"] == parameter]
    wide = rows.pivot_table(
        index=["year", "festival"], columns="phase", values="value", aggfunc="first"
    )
    if "pre" not in wide or phase not in wide:
        return pd.Series(dtype=float)
    return (wide[phase] - wide["pre"]).dropna()


def shock_axis(site_scored: pd.DataFrame) -> Axis:
    do_change = phase_changes(site_scored, "Dissolved oxygen", "during")
    bod_change = phase_changes(site_scored, "BOD", "during")
    worse = (do_change <= -MATERIAL_CHANGE_MG_L).reindex(
        do_change.index.union(bod_change.index), fill_value=False
    ) | (bod_change >= MATERIAL_CHANGE_MG_L).reindex(
        do_change.index.union(bod_change.index), fill_value=False
    )
    failing, total = int(worse.sum()), len(worse)
    return Axis(
        verdict=verdict(failing, total),
        failing=failing,
        total=total,
        median_do_change=median_or_none(do_change),
        median_bod_change=median_or_none(bod_change),
    )


def recovery_axis(site_scored: pd.DataFrame) -> Axis:
    after = site_scored[
        (site_scored["phase"] == "after") & (site_scored["parameter"] != "pH")
    ]
    failing, total = int(after["fails"].sum()), len(after)
    return Axis(
        verdict=verdict(failing, total),
        failing=failing,
        total=total,
        median_do_change=median_or_none(
            phase_changes(site_scored, "Dissolved oxygen", "after")
        ),
        median_bod_change=median_or_none(phase_changes(site_scored, "BOD", "after")),
    )


def median_or_none(series: pd.Series) -> float | None:
    return None if series.empty else round(float(series.median()), 1)


def reading(row: pd.Series) -> Reading:
    value = None if pd.isna(row["value"]) else float(row["value"])
    parameter = str(row["parameter"])
    flag = None if pd.isna(row["flag"]) else str(row["flag"])
    return Reading(
        value=value,
        printed=str(row["value_as_printed"]),
        flag=flag,
        fails=None if value is None else fails_limit(parameter, value),
        detection_limit_as_value=value is not None
        and DETECTION_LIMIT_AS_VALUE.get(parameter) == value,
        source_page=int(row["source_page"]),
    )


def parameter_evidence(
    site_rows: pd.DataFrame, parameter: str, events: list[tuple[int, str]]
) -> ParameterEvidence:
    rows = site_rows[site_rows["parameter"] == parameter]
    limit = CLASS_B_LIMITS.get(parameter)
    numeric = rows[rows["value"].notna()]
    unit_values = rows["unit_assumed"].dropna()
    event_readings: list[EventReadings] = []
    for year, festival in events:
        event_rows = rows[(rows["year"] == year) & (rows["festival"] == festival)]
        if event_rows.empty:
            continue
        by_phase = {str(r["phase"]): reading(r) for _, r in event_rows.iterrows()}
        event_readings.append(
            EventReadings(
                year=year,
                festival=festival,
                pre=by_phase.get("pre"),
                during=by_phase.get("during"),
                after=by_phase.get("after"),
            )
        )
    return ParameterEvidence(
        parameter=parameter,
        unit="" if unit_values.empty else str(unit_values.iloc[0]),
        limit=limit,
        readings=len(numeric),
        failing=None
        if limit is None
        else int(sum(limit.fails(float(v)) for v in numeric["value"])),
        events=event_readings,
    )


def coverage(site_rows: pd.DataFrame, events: list[tuple[int, str]]) -> list[Coverage]:
    result: list[Coverage] = []
    for year, festival in events:
        event_rows = site_rows[
            (site_rows["year"] == year) & (site_rows["festival"] == festival)
        ]
        sampled = {
            phase: bool(
                (event_rows["phase"] == phase).any()
                and (
                    event_rows.loc[event_rows["phase"] == phase, "value"].notna()
                    | event_rows.loc[event_rows["phase"] == phase, "flag"].isin(
                        ["BDL", "ND"]
                    )
                ).any()
            )
            for phase in ("pre", "during", "after")
        }
        result.append(Coverage(year=year, festival=festival, **sampled))
    return result


def notes(frame: pd.DataFrame, ghats: list[GhatRanking]) -> list[Note]:
    at_detection_limit = pd.Series(False, index=frame.index)
    for parameter, value in DETECTION_LIMIT_AS_VALUE.items():
        at_detection_limit |= (frame["parameter"] == parameter) & (
            frame["value"] == value
        )
    detection_rows = int(at_detection_limit.sum())
    missing_tables = [
        f"{g.site} ({c.festival} {c.year})"
        for g in ghats
        for c in g.coverage
        if not (c.pre or c.during or c.after)
    ]
    ambiguous = [g.site for g in ghats if g.site_confidence != "high"]
    result = [
        Note(
            key="coliform",
            en="Total coliform, the fourth Class B criterion, was never tested at any ghat in these reports. No ghat can be certified Class B from this data.",
            hi="क्लास B का चौथा मानक, टोटल कोलीफ़ॉर्म, इन रिपोर्टों में किसी घाट पर जाँचा ही नहीं गया। इस डेटा से कोई घाट क्लास B प्रमाणित नहीं हो सकता।",
        ),
        Note(
            key="units",
            en="The reports print no units. Standard units are assumed as in the organisers' data dictionary.",
            hi="रिपोर्टों में इकाइयाँ छपी नहीं हैं। डेटा डिक्शनरी के अनुसार मानक इकाइयाँ मानी गई हैं।",
        ),
        Note(
            key="detection_limit",
            en=f"{detection_rows} metal readings print the lab's detection limit (chromium 0.03, lead 0.031, copper 0.018 mg/l) as if measured. The tool marks them 'at detection limit', not as measurements.",
            hi=f"{detection_rows} धातु रीडिंग में लैब की पहचान-सीमा (क्रोमियम 0.03, लेड 0.031, कॉपर 0.018 mg/l) को माप की तरह छापा गया है। टूल इन्हें 'पहचान-सीमा पर' दिखाता है, माप नहीं।",
        ),
    ]
    if missing_tables:
        joined = "; ".join(missing_tables)
        result.append(
            Note(
                key="missing_tables",
                en=f"No table in the report for: {joined}. Shown as not sampled, never as clean.",
                hi=f"रिपोर्ट में इनकी तालिका नहीं है: {joined}। इन्हें 'नमूना नहीं' दिखाया गया है, साफ़ नहीं।",
            )
        )
    if ambiguous:
        joined = "; ".join(ambiguous)
        result.append(
            Note(
                key="site_identity",
                en=f"Site identity uncertain for: {joined}. Ganesh tables say 'Kamla Park kund', Durga tables say 'Lower Lake ghat'; these may be two places.",
                hi=f"इस घाट की पहचान अनिश्चित है: {joined}। गणेश तालिकाएँ 'कमला पार्क कुंड' और दुर्गा तालिकाएँ 'लोअर लेक घाट' लिखती हैं; ये दो जगहें हो सकती हैं।",
            )
        )
    return result


def reason_en(
    failing: int, total: int, chronic: Axis, shock: Axis, recovery: Axis
) -> str:
    parts = [
        f"{failing} of {total} oxygen, BOD and pH readings break the bathing limit."
    ]
    match chronic.verdict:
        case "fail":
            parts.append(
                f"Water was already failing before idols went in ({chronic.failing} of {chronic.total} pre-immersion readings). Aerate before the festival or do not use this ghat."
            )
        case "warn":
            parts.append(
                f"Some pre-immersion readings already failed ({chronic.failing} of {chronic.total}). Test before the festival."
            )
        case "pass":
            parts.append(
                "Water met the limits before immersion in every sampled festival."
            )
        case "unknown":
            parts.append("No pre-immersion sample exists.")
    match shock.verdict:
        case "fail":
            parts.append(
                f"Immersion hits hard: in {shock.failing} of {shock.total} festivals oxygen fell or BOD rose by 1 mg/l or more. Plan cranes, liners and crowd control on the day."
            )
        case "warn":
            parts.append(
                f"Water clearly worsened during immersion in {shock.failing} of {shock.total} festivals."
            )
        case "pass":
            parts.append("No large change during immersion.")
        case "unknown":
            parts.append("No before-and-during pair exists to measure the shock.")
    match recovery.verdict:
        case "fail":
            parts.append(
                f"One week after, {recovery.failing} of {recovery.total} oxygen and BOD readings still broke the limit. Send cleanup crews and re-test."
            )
        case "warn":
            parts.append(
                f"One week after, {recovery.failing} of {recovery.total} oxygen and BOD readings still broke the limit. Re-test."
            )
        case "pass":
            parts.append("One week after, oxygen and BOD were back within the limit.")
        case "unknown":
            parts.append("No one-week-after sample exists.")
    return " ".join(parts)


def reason_hi(
    failing: int, total: int, chronic: Axis, shock: Axis, recovery: Axis
) -> str:
    parts = [f"ऑक्सीजन, BOD और pH की {total} में से {failing} रीडिंग स्नान-मानक से बाहर हैं।"]
    match chronic.verdict:
        case "fail":
            parts.append(
                f"विसर्जन से पहले ही पानी मानक पर नहीं था ({chronic.total} में से {chronic.failing} रीडिंग)। त्योहार से पहले एरेशन (पानी में हवा देना) करें या यह घाट न चुनें।"
            )
        case "warn":
            parts.append(
                f"विसर्जन से पहले कुछ रीडिंग ({chronic.total} में से {chronic.failing}) मानक से बाहर थीं। त्योहार से पहले जाँच करें।"
            )
        case "pass":
            parts.append("हर नमूने वाले त्योहार में विसर्जन से पहले पानी मानक पर था।")
        case "unknown":
            parts.append("विसर्जन से पहले का कोई नमूना नहीं है।")
    match shock.verdict:
        case "fail":
            parts.append(
                f"विसर्जन का झटका तेज़ है: {shock.total} में से {shock.failing} त्योहारों में ऑक्सीजन 1 mg/l या ज़्यादा गिरी या BOD 1 mg/l या ज़्यादा बढ़ा। उस दिन क्रेन, लाइनर और भीड़-नियंत्रण की योजना बनाएँ।"
            )
        case "warn":
            parts.append(
                f"{shock.total} में से {shock.failing} त्योहारों में विसर्जन के दौरान पानी साफ़ तौर पर बिगड़ा।"
            )
        case "pass":
            parts.append("विसर्जन के दौरान पानी में बड़ा बदलाव नहीं दिखा।")
        case "unknown":
            parts.append("झटका मापने के लिए पहले-और-दौरान की जोड़ी नहीं है।")
    match recovery.verdict:
        case "fail":
            parts.append(
                f"एक हफ्ते बाद भी ऑक्सीजन और BOD की {recovery.total} में से {recovery.failing} रीडिंग मानक से बाहर थीं। सफ़ाई दल भेजें और दोबारा जाँच करें।"
            )
        case "warn":
            parts.append(
                f"एक हफ्ते बाद ऑक्सीजन और BOD की {recovery.total} में से {recovery.failing} रीडिंग अभी भी मानक से बाहर थीं। दोबारा जाँच करें।"
            )
        case "pass":
            parts.append("एक हफ्ते बाद ऑक्सीजन और BOD मानक पर लौट आए।")
        case "unknown":
            parts.append("एक हफ्ते बाद का कोई नमूना नहीं है।")
    return " ".join(parts)
