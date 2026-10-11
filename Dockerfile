FROM node:24.21.0-alpine AS web
# Plain npm install keeps the Dockerfile free of BuildKit-only syntax, so ACR Tasks can build it.
RUN npm install -g pnpm@11.27.1
ENV CI=true
WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY web .
RUN pnpm run build

FROM ghcr.io/astral-sh/uv:0.12.19-python3.13-alpine AS api
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=0
WORKDIR /app
COPY pyproject.toml uv.lock ./
COPY api/pyproject.toml api/
RUN uv sync --frozen --no-dev --no-install-workspace --package ghat-pehredaar-api
COPY api api
RUN uv sync --frozen --no-dev --no-editable --package ghat-pehredaar-api

FROM python:3.13.16-alpine AS serve
RUN adduser -D -H -u 10001 app
WORKDIR /app
ENV GHAT_DATA_DIR=/app/data GHAT_WEB_DIST=/app/web/dist/client
COPY --from=api /app/.venv /app/.venv
COPY --from=web /app/web/dist/client /app/web/dist/client
COPY data /app/data
USER 10001
EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "ghat_pehredaar_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
