"""Real integration tests against a real local Postgres instance — no
mocking, matching the same philosophy as implementation/server/test/ (which
tests the Node API against a real Postgres, never a mocked one). Skips
cleanly if no local Postgres is reachable, so `pytest` doesn't hard-fail in
an environment without the dev DB running.
"""
import psycopg2
import pytest

from deploy.config import Config
from deploy import db as db_ops

TEST_DB_NAME = "von_digitalis_pytest"


def _server_reachable(cfg: Config) -> bool:
    try:
        conn = psycopg2.connect(host=cfg.db_host, port=cfg.db_port, user=cfg.db_user, dbname="postgres")
        conn.close()
        return True
    except psycopg2.OperationalError:
        return False


@pytest.fixture
def cfg():
    base = Config(db_name=TEST_DB_NAME)
    if not _server_reachable(base):
        pytest.skip("No local Postgres reachable on the configured host/port — skipping DB integration tests.")
    yield base
    # Teardown: drop the scratch database this test suite created.
    conn = psycopg2.connect(host=base.db_host, port=base.db_port, user=base.db_user, dbname="postgres")
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = %s AND pid <> pg_backend_pid()",
                (TEST_DB_NAME,),
            )
            cur.execute(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"')
    finally:
        conn.close()


def test_init_database_applies_schema_and_seed(cfg):
    result = db_ops.init_database(cfg, reset=True)
    assert TEST_DB_NAME in result

    counts = db_ops.table_counts(cfg)
    # The real schema has 26 tables — this is the same assertion
    # implementation/docs/database-schema.md documents.
    assert len(counts) == 26
    # Seed data actually landed, not just an empty schema.
    assert counts["models"] == 7
    assert counts["zones"] == 9
    assert counts["users"] == 4


def test_init_database_is_idempotent_without_reset(cfg):
    db_ops.init_database(cfg, reset=True)
    first_counts = db_ops.table_counts(cfg)

    # Re-applying without --reset should fail loudly (schema.sql has no
    # IF NOT EXISTS guards on purpose — a silent partial-apply would be
    # worse than an explicit error) rather than silently duplicating data.
    with pytest.raises(Exception):
        db_ops.apply_sql_file(cfg, cfg.schema_path)

    # And the original data is untouched by the failed attempt (the
    # transaction rolled back).
    assert db_ops.table_counts(cfg) == first_counts


def test_backup_produces_a_readable_csv_dump(cfg, tmp_path):
    db_ops.init_database(cfg, reset=True)
    out_path = db_ops.backup(cfg, tmp_path)

    assert out_path.exists()
    content = out_path.read_text()
    assert "-- backup of" in content
    assert "-- end models" in content
    # A real seeded model name should actually appear in the dumped CSV.
    assert "Piranha-Count" in content
