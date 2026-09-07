"""Database deployment operations (ADR014 relational store, ADR019 tiered
backup/DR strategy). Thin wrappers over psycopg2 — no ORM, matching the
real app's own approach (implementation/server/src/db.js is plain SQL too).
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import psycopg2

from deploy.config import Config


def _connect(cfg: Config, dbname: str | None = None):
    return psycopg2.connect(
        host=cfg.db_host,
        port=cfg.db_port,
        user=cfg.db_user,
        dbname=dbname or cfg.db_name,
    )


def database_exists(cfg: Config) -> bool:
    conn = _connect(cfg, dbname="postgres")
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (cfg.db_name,))
            return cur.fetchone() is not None
    finally:
        conn.close()


def create_database(cfg: Config) -> None:
    conn = _connect(cfg, dbname="postgres")
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute(f'CREATE DATABASE "{cfg.db_name}"')
    finally:
        conn.close()


def apply_sql_file(cfg: Config, path: Path) -> None:
    """Applies a .sql file statement-by-statement-via-psql-equivalent: we
    just hand the whole file to the server in one execute, matching how
    `psql -f` behaves for a script with no client-side (\\) commands — both
    schema.sql and seed.sql are plain SQL, so this is safe and simpler than
    a hand-rolled statement splitter (which breaks on `$$`-quoted function
    bodies and semicolons inside string literals).
    """
    sql = path.read_text()
    conn = _connect(cfg)
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database(cfg: Config, reset: bool = False) -> str:
    """Applies schema.sql then seed.sql. If reset=True, drops and recreates
    the database first (used for demo/dev resets — never call with
    reset=True against anything real; see ADR019 for why a real deploy
    goes through backup/restore, not drop/recreate).
    """
    if reset and database_exists(cfg):
        conn = _connect(cfg, dbname="postgres")
        conn.autocommit = True
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = %s AND pid <> pg_backend_pid()",
                    (cfg.db_name,),
                )
                cur.execute(f'DROP DATABASE "{cfg.db_name}"')
        finally:
            conn.close()

    if not database_exists(cfg):
        create_database(cfg)

    apply_sql_file(cfg, cfg.schema_path)
    apply_sql_file(cfg, cfg.seed_path)
    return f"Initialized {cfg.db_name} from {cfg.schema_path.name} + {cfg.seed_path.name}"


def backup(cfg: Config, out_dir: Path) -> Path:
    """A plain-SQL logical backup via COPY, table by table — deliberately
    not shelling out to pg_dump, so this works anywhere psycopg2 does
    without assuming the pg_dump binary is on PATH (relevant for a
    container image that only bundles the Python client library).
    ADR019: this is the "reference data" tier's daily point-in-time
    mechanism in spirit — a real deploy would use the managed cloud
    provider's native backup service for the actual PITR guarantee; this
    script is what a restore-drill or an ad-hoc export would run.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = out_dir / f"{cfg.db_name}-{stamp}.sql"

    conn = _connect(cfg)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
            )
            tables = [r[0] for r in cur.fetchall()]

        with out_path.open("w") as f:
            f.write(f"-- backup of {cfg.db_name} at {stamp}\n")
            for table in tables:
                with conn.cursor() as cur:
                    cur.copy_expert(f'COPY "{table}" TO STDOUT WITH CSV HEADER', f)
                f.write(f"-- end {table}\n")
    finally:
        conn.close()

    return out_path


def table_counts(cfg: Config) -> dict[str, int]:
    """Used by the health-check / smoke-test flow to confirm the schema
    actually has data after init/restore, not just that it applied
    without error.
    """
    conn = _connect(cfg)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
            )
            tables = [r[0] for r in cur.fetchall()]
        counts = {}
        with conn.cursor() as cur:
            for table in tables:
                cur.execute(f'SELECT COUNT(*) FROM "{table}"')
                counts[table] = cur.fetchone()[0]
        return counts
    finally:
        conn.close()
