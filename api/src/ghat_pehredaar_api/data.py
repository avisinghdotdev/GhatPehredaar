"""Loads the organisers' CSVs and holds the CPCB Class B limits the tool scores against."""

import os
from pathlib import Path
from typing import Literal

import pandas as pd
from pydantic import BaseModel

REPO_ROOT = Path(__file__).resolve().parents[3]
# The container image installs the package into site-packages and sets both paths explicitly.
DATA_DIR = Path(os.environ.get("GHAT_DATA_DIR", REPO_ROOT / "data"))
WEB_DIST = Path(os.environ.get("GHAT_WEB_DIST", REPO_ROOT / "web" / "dist" / "client"))
READINGS_CSV = DATA_DIR / "bhopal_ghats_2023_2025.csv"
BRIEF_JSON = DATA_DIR / "brief.json"
REPORT_YEARS = (2023, 2024, 2025)

Phase = Literal["pre", "during", "after"]
PHASES: tuple[Phase, ...] = ("pre", "during", "after")


class Limit(BaseModel):
    """One CPCB Class B (outdoor bathing) limit, from cpcb.gov.in/water-quality-criteria."""

    parameter: str
    kind: Literal["min", "max", "range"]
    low: float | None = None
    high: float | None = None
    unit: str

    def fails(self, value: float) -> bool:
        if self.low is not None and value < self.low:
            return True
        return self.high is not None and value > self.high


CLASS_B_LIMITS: dict[str, Limit] = {
    "Dissolved oxygen": Limit(
        parameter="Dissolved oxygen", kind="min", low=5.0, unit="mg/l"
    ),
    "BOD": Limit(parameter="BOD", kind="max", high=3.0, unit="mg/l"),
    "pH": Limit(parameter="pH", kind="range", low=6.5, high=8.5, unit=""),
}

# Parameters shown in the evidence drawer; the first three carry a limit, the rest are context.
SHOWN_PARAMETERS = (
    "Dissolved oxygen",
    "BOD",
    "pH",
    "COD",
    "Conductivity",
    "Turbidity",
    "Total solids",
    "Chromium",
    "Lead",
    "Zinc",
    "Copper",
)

# Values the 2025 report prints where other years print BDL; they equal the lab's detection limits
# as printed in MPPCB's Upper Lake monthly report ("<0.031" lead, "<0.018" copper).
DETECTION_LIMIT_AS_VALUE = {"Chromium": 0.03, "Lead": 0.031, "Copper": 0.018}


def report_pdf(year: int) -> Path:
    return DATA_DIR / f"mppcb-visarjan-report-{year}.pdf"


def load_readings() -> pd.DataFrame:
    if not READINGS_CSV.exists():
        raise FileNotFoundError(f"readings CSV missing: {READINGS_CSV}")
    frame = pd.read_csv(
        READINGS_CSV,
        dtype={
            "flag": "string",
            "unit_assumed": "string",
            "value_as_printed": "string",
        },
    )
    frame["source_page"] = frame["source_page"].astype(int)
    return frame
