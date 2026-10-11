set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# List available recipes
default:
    @just --list

# Sync all dependencies and install the pre-commit git hook (git, just, Node, and the Azure CLI are manual installs)
init: _ensure-uv _ensure-pnpm
    uv sync
    uv run pre-commit install --install-hooks
    pnpm --dir web install

# Install uv via the official installer when it is not on PATH
[windows]
_ensure-uv:
    @if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { \
        irm https://astral.sh/uv/install.ps1 | iex; \
        [Console]::Error.WriteLine("uv installed - restart your shell if the next step fails") \
    }

# Install pnpm for the current user when it is not on PATH
[windows]
_ensure-pnpm:
    @if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { npm install -g pnpm@11.27.1 }

# Run the API on http://localhost:8000 with reload
api:
    uv run --frozen uvicorn ghat_pehredaar_api.main:app --port 8000 --reload --reload-dir api/src

# Run the SPA dev server on http://localhost:5173 (proxies /api to the API)
web:
    pnpm --dir web run dev

# Regenerate web/openapi.json and the typed client from the API code
client:
    uv run --frozen python -m ghat_pehredaar_api.openapi web/openapi.json
    pnpm --dir web run api:generate

# Write data/brief.json with Claude; reads ANTHROPIC_API_KEY from .env
brief:
    uv run --frozen --env-file .env python -m ghat_pehredaar_api.brief

# Run every check: API tests, web typecheck, lint, knip
check:
    uv run --frozen pytest -q
    pnpm --dir web run typecheck
    pnpm --dir web run lint
    pnpm --dir web run knip

# Build the SPA into web/dist so the API can serve it from one origin
build-web:
    pnpm --dir web run build

# Build the image in Azure Container Registry and deploy it to the Container App (no local Docker needed)
deploy:
    az containerapp up --subscription az-sub-ghatpehredaar-prod --name ca-ghatpehredaar-prod --resource-group rg-ghatpehredaar-prod --location centralindia --environment cae-ghatpehredaar-prod --source . --ingress external --target-port 8000

# Build and run the container locally (needs Docker Desktop)
up:
    docker compose up --build

# Stop the local container
down:
    docker compose down
