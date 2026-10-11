from functools import lru_cache
from importlib.metadata import version
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ghat_pehredaar_api.data import (
    BRIEF_JSON,
    REPORT_YEARS,
    WEB_DIST,
    load_readings,
    report_pdf,
)
from ghat_pehredaar_api.scoring import Ranking, rank_ghats

app = FastAPI(title="Ghat Pehredaar API", version=version("ghat-pehredaar-api"))


class Health(BaseModel):
    status: Literal["ok"]
    version: str


class Brief(BaseModel):
    """Bilingual officer brief written by `python -m ghat_pehredaar_api.brief`."""

    generated_at: str
    model: str
    en: str
    hi: str


@lru_cache
def ranking() -> Ranking:
    return rank_ghats(load_readings())


@app.get("/api/health", operation_id="health")
def health() -> Health:
    return Health(status="ok", version=app.version)


@app.get("/api/ranking", operation_id="ranking")
def get_ranking() -> Ranking:
    return ranking()


@app.get("/api/brief", operation_id="brief")
def get_brief() -> Brief:
    if not BRIEF_JSON.exists():
        raise HTTPException(
            status_code=404, detail="Brief not generated yet; run `just brief`."
        )
    return Brief.model_validate_json(BRIEF_JSON.read_text(encoding="utf-8"))


@app.get("/api/pdf/{year}", operation_id="reportPdf")
def get_report_pdf(year: int) -> FileResponse:
    if year not in REPORT_YEARS:
        raise HTTPException(status_code=404, detail=f"No MPPCB report for {year}.")
    return FileResponse(report_pdf(year), media_type="application/pdf")


# The built SPA is served from the same origin in the container; in local dev Vite serves it.
if WEB_DIST.exists():
    app.mount("/", StaticFiles(directory=WEB_DIST, html=True), name="web")
