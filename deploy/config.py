"""Deployment configuration — loaded from environment variables (optionally
via a .env file, ADR020's pipeline would inject these as real env vars) with
sensible local-dev defaults matching implementation/README.md's documented
setup. A YAML file can override any of these for a named environment
(staging/production), since ADR013 doesn't fix a single deploy target yet.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, replace
from pathlib import Path

import yaml
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Config:
    db_host: str = "localhost"
    db_port: int = 5433
    db_user: str = "vondigitalis"
    db_name: str = "von_digitalis"
    api_base_url: str = "http://localhost:4000"
    schema_path: Path = REPO_ROOT / "implementation" / "db" / "schema.sql"
    seed_path: Path = REPO_ROOT / "implementation" / "db" / "seed.sql"

    @property
    def dsn(self) -> str:
        return f"host={self.db_host} port={self.db_port} user={self.db_user} dbname={self.db_name}"


def load_config(env_file: Path | None = None, yaml_file: Path | None = None) -> Config:
    """Precedence, lowest to highest: dataclass defaults -> .env -> YAML file
    -> real process environment variables. Each layer only overrides what it
    actually sets, so a partial YAML file (e.g. just db_host for staging)
    doesn't blow away the other defaults.
    """
    load_dotenv(env_file or (REPO_ROOT / ".env"), override=False)

    cfg = Config()

    if yaml_file and yaml_file.exists():
        data = yaml.safe_load(yaml_file.read_text()) or {}
        overrides = {k: v for k, v in data.items() if k in cfg.__dataclass_fields__}
        if "schema_path" in overrides:
            overrides["schema_path"] = Path(overrides["schema_path"])
        if "seed_path" in overrides:
            overrides["seed_path"] = Path(overrides["seed_path"])
        cfg = replace(cfg, **overrides)

    env_overrides = {}
    for field in cfg.__dataclass_fields__:
        env_key = f"VDE_{field.upper()}"
        if env_key in os.environ:
            env_overrides[field] = os.environ[env_key]
    if "db_port" in env_overrides:
        env_overrides["db_port"] = int(env_overrides["db_port"])
    if "schema_path" in env_overrides:
        env_overrides["schema_path"] = Path(env_overrides["schema_path"])
    if "seed_path" in env_overrides:
        env_overrides["seed_path"] = Path(env_overrides["seed_path"])

    return replace(cfg, **env_overrides)
