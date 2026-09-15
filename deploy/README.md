# Deployment & Ops Toolkit

Python scripts for deploying, backing up, and health-checking the Node.js application in `implementation/` — this does not run the app itself (see `implementation/README.md` for that). Dependencies: `requirements.txt` at the repo root.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # adjust if your local Postgres/API aren't on the defaults
```

## Commands

```bash
# Apply schema.sql + seed.sql to a fresh database
python -m deploy.cli db init

# Same, but drop and recreate first (dev/demo reset only — never against a
# real environment; see ADR019, this is not the production restore path)
python -m deploy.cli db init --reset

# Row counts per table — confirms init/restore actually landed data
python -m deploy.cli db counts

# Logical CSV backup, one file per table concatenated with markers
python -m deploy.cli db backup --out-dir backups/

# Smoke-test a running deployment (API + static webapp)
python -m deploy.cli health-check --base-url http://localhost:4000

# ADR020's golden-set hard gate, as an actual pipeline step — exits
# non-zero if any tracked AI model is blocked
python -m deploy.cli deploy-gate-check --admin-email priya.nair@vondigitalis.example
```

Point any command at a different environment with `--config path/to/env.yaml` (see `deploy/config.py` for the fields it accepts) or by exporting `VDE_*` environment variables — real deployments should use the pipeline's own secret store for these, not a committed file (ADR020).

## Why the deploy gate matters here specifically

`deploy-gate-check` is not a generic health check — it re-implements ADR020's actual decision as a pipeline step: sign in as an Admin, ask the real running API for the model registry (the same endpoint the AI Governance Console webapp calls), and fail the build if anything is `blocked`. It doesn't re-derive that status itself; the API (`implementation/server/src/services/ai-governance/routes.js`) is the single source of truth, exactly as ADR011 intends. Try it against the seeded demo data — `Piranha-Count v3.2` is blocked by default, so a fresh `db init` followed by `deploy-gate-check` should fail, on purpose, until an override is recorded via the AI Governance Console.

## Tests

```bash
pytest deploy/tests/ -v
```

`test_config.py` and most of `test_healthcheck.py`/`test_gate.py` are pure unit tests (mocked HTTP, no external services). `test_db.py` is a real integration suite against a real local Postgres — it creates and drops its own scratch database (`von_digitalis_pytest`), never touching `von_digitalis` itself, and skips cleanly if no Postgres is reachable rather than failing the whole run.
