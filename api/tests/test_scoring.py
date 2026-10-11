from ghat_pehredaar_api.data import load_readings
from ghat_pehredaar_api.scoring import rank_ghats

ranking = rank_ghats(load_readings())


def test_totals_match_the_problem_statement() -> None:
    do = [
        p
        for g in ranking.ghats
        for p in g.parameters
        if p.parameter == "Dissolved oxygen"
    ]
    bod = [p for g in ranking.ghats for p in g.parameters if p.parameter == "BOD"]
    assert sum(p.readings for p in do) == 116
    assert sum(p.failing or 0 for p in do) == 42
    assert sum(p.readings for p in bod) == 112
    assert sum(p.failing or 0 for p in bod) == 100


def test_bairagarh_is_chronic_and_unrecovered() -> None:
    bairagarh = ranking.ghats[0]
    assert bairagarh.site == "Bairagarh (Sant Hirdaram) kund"
    assert bairagarh.chronic.verdict == "fail"
    assert bairagarh.recovery.verdict == "fail"
    assert bairagarh.rank_low == 1


def test_missing_durga_2025_tables_are_reported_as_gaps() -> None:
    gap = next(note for note in ranking.notes if note.key == "missing_tables")
    assert "Bairagarh (Sant Hirdaram) kund (Durga 2025)" in gap.en
    assert "Malikhedi kund (Durga 2025)" in gap.en


def test_detection_limit_values_are_flagged_not_measured() -> None:
    khatlapura = next(g for g in ranking.ghats if g.site == "Khatlapura ghat")
    lead = next(p for p in khatlapura.parameters if p.parameter == "Lead")
    ganesh_2025 = next(
        e for e in lead.events if e.year == 2025 and e.festival == "Ganesh"
    )
    assert ganesh_2025.pre is not None
    assert ganesh_2025.pre.detection_limit_as_value is True
