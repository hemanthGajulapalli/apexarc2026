import os
from pathlib import Path

import pytest

from deploy.config import Config, load_config


def test_defaults_match_documented_local_setup(tmp_path, monkeypatch):
    # No .env, no YAML, no env vars set — should fall back to the exact
    # values implementation/README.md documents for local dev.
    missing_env = tmp_path / "does-not-exist.env"
    for key in list(os.environ):
        if key.startswith("VDE_"):
            monkeypatch.delenv(key, raising=False)

    cfg = load_config(env_file=missing_env)
    assert cfg.db_host == "localhost"
    assert cfg.db_port == 5433
    assert cfg.db_user == "vondigitalis"
    assert cfg.db_name == "von_digitalis"
    assert cfg.api_base_url == "http://localhost:4000"


def test_yaml_override_is_partial_not_wholesale(tmp_path, monkeypatch):
    for key in list(os.environ):
        if key.startswith("VDE_"):
            monkeypatch.delenv(key, raising=False)

    yaml_file = tmp_path / "staging.yaml"
    yaml_file.write_text("db_host: staging-db.internal\n")

    cfg = load_config(env_file=tmp_path / "missing.env", yaml_file=yaml_file)
    assert cfg.db_host == "staging-db.internal"
    # everything else stays default — a partial override doesn't wipe the rest
    assert cfg.db_port == 5433
    assert cfg.db_name == "von_digitalis"


def test_env_var_wins_over_yaml(tmp_path, monkeypatch):
    yaml_file = tmp_path / "staging.yaml"
    yaml_file.write_text("db_host: staging-db.internal\n")
    monkeypatch.setenv("VDE_DB_HOST", "env-wins.internal")

    cfg = load_config(env_file=tmp_path / "missing.env", yaml_file=yaml_file)
    assert cfg.db_host == "env-wins.internal"

    monkeypatch.delenv("VDE_DB_HOST", raising=False)


def test_dsn_reflects_config():
    cfg = Config(db_host="h", db_port=1234, db_user="u", db_name="d")
    assert cfg.dsn == "host=h port=1234 user=u dbname=d"
