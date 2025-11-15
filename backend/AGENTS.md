# Repository Guidelines

## Project Structure & Module Organization
The FastAPI app lives under `src/`, with `src/main.py` exposing the ASGI app, `src/database.py` configuring the async SQLAlchemy engine, and global settings in `src/config.py` plus `src/constants.py`. Feature modules such as `auth/` and shared helpers stay inside `src/`. Migrations sit in `alembic/versions/YYYY-MM-DD_slug.py`. Runtime scripts live in `entrypoints/` and `scripts/postgres/`, while `.env` and `logging*.ini` hold local config.

## Build, Test, and Development Commands
`poetry install` creates the virtualenv and installs dependencies pinned in `pyproject.toml`. `just up` starts the local Postgres instance configured for migrations. `just run --log-config logging.ini` launches uvicorn against `src.main:app` with structured logs. `just lint` runs `ruff --fix` and `ruff format`; pass `--check` before committing to avoid rewrites. `just mm add_users_table` autogenerates a migration from `src/database.py`, and `just migrate` (or `just downgrade -1`) applies it. For container smoke tests use `docker compose -f docker-compose.prod.yml up -d --build`.

## Coding Style & Naming Conventions
Use standard Python 3.11 styling with 4-space indentation, full type hints, and explicit async/await boundaries in FastAPI routers. Modules, packages, and migrations are snake_case; Pydantic models in `src/schemas.py` are PascalCase. Run `ruff` locally before pushing—its configuration (`ruff.toml`) already enforces import sorting and formatting. Keep settings in `src/config.py` and expose new env vars via `pydantic-settings` models before referencing them in code.

## Testing Guidelines
Automated tests are not yet checked in, so create a `tests/` package mirroring the `src/` layout. Prefer `pytest` with `httpx.AsyncClient` for API tests and `pytest.mark.asyncio` for coroutine cases. Name files `test_<feature>.py` and functions `test_<behavior>`. Once `pytest` is added as a dev dependency, run `poetry run pytest -q` and target high-coverage on risk areas (auth, database, exception handling). Smoke-test migrations with `just migrate` against the ephemeral Postgres container before shipping.

## Commit & Pull Request Guidelines
The current history (`git log --oneline` → `init`) uses short, imperative messages; continue with Conventional Commit prefixes such as `feat: add lobby routes`. Each PR should summarize intent, list migrations or config changes, reference the tracking issue, and attach screenshots or curl transcripts when changing HTTP responses. Always run `just lint` and the relevant migrations/tests before requesting review, and include rollback steps when altering infrastructure code (Docker, entrypoints).

## Security & Configuration Tips
Never commit `.env` or database dumps; store secrets via your deployment stack and load them with `Settings` from `src/config.py`. Validate that `SENTRY_DSN` and logging configs are present in staging before enabling production features. When working locally, rotate database credentials via `scripts/postgres/backup|restore` rather than editing `alembic.ini` by hand, and review the Dockerfile when introducing new dependencies to keep the final image minimal.
