from fastapi.testclient import TestClient

from ghat_pehredaar_api.main import app

client = TestClient(app)


def test_health_reports_ok_and_version() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"] == app.version


def test_ranking_lists_seven_ghats_worst_first() -> None:
    response = client.get("/api/ranking")
    assert response.status_code == 200
    ghats = response.json()["ghats"]
    assert len(ghats) == 7
    assert ghats[0]["site"] == "Bairagarh (Sant Hirdaram) kund"
    assert [g["rank"] for g in ghats] == list(range(1, 8))


def test_report_pdf_rejects_unknown_year() -> None:
    assert client.get("/api/pdf/2022").status_code == 404
