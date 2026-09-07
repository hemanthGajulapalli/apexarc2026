"""Deployment CLI for Von Digitalis Estates.

Usage:
    python -m deploy.cli db init [--reset] [--config path/to/env.yaml]
    python -m deploy.cli db backup [--out-dir backups/]
    python -m deploy.cli db counts
    python -m deploy.cli health-check [--base-url http://localhost:4000]
    python -m deploy.cli deploy-gate-check --admin-email priya.nair@vondigitalis.example
"""
from __future__ import annotations

import sys
from pathlib import Path

import click

from deploy.config import load_config
from deploy import db as db_ops
from deploy import healthcheck
from deploy import gate


@click.group()
@click.option("--config", "config_path", type=click.Path(path_type=Path), default=None,
              help="Optional YAML file overriding config for a named environment.")
@click.pass_context
def cli(ctx: click.Context, config_path: Path | None):
    ctx.ensure_object(dict)
    ctx.obj["cfg"] = load_config(yaml_file=config_path)


@cli.group()
def db():
    """Database deployment operations (ADR014, ADR019)."""


@db.command("init")
@click.option("--reset", is_flag=True, help="Drop and recreate the database first. Dev/demo only.")
@click.pass_context
def db_init(ctx: click.Context, reset: bool):
    cfg = ctx.obj["cfg"]
    click.echo(f"Applying {cfg.schema_path.name} + {cfg.seed_path.name} to {cfg.db_name} on {cfg.db_host}:{cfg.db_port}...")
    result = db_ops.init_database(cfg, reset=reset)
    click.echo(click.style(result, fg="green"))


@db.command("backup")
@click.option("--out-dir", type=click.Path(path_type=Path), default=Path("backups"))
@click.pass_context
def db_backup(ctx: click.Context, out_dir: Path):
    cfg = ctx.obj["cfg"]
    path = db_ops.backup(cfg, out_dir)
    click.echo(click.style(f"Backed up {cfg.db_name} to {path}", fg="green"))


@db.command("counts")
@click.pass_context
def db_counts(ctx: click.Context):
    cfg = ctx.obj["cfg"]
    counts = db_ops.table_counts(cfg)
    width = max(len(t) for t in counts) if counts else 0
    for table, count in counts.items():
        click.echo(f"  {table.ljust(width)}  {count}")
    click.echo(f"Total tables: {len(counts)}")


@cli.command("health-check")
@click.option("--base-url", default="http://localhost:4000")
@click.pass_context
def health_check(ctx: click.Context, base_url: str):
    api_result = healthcheck.check_health(base_url)
    webapp_result = healthcheck.check_webapp_served(base_url)

    for name, result in [("API", api_result), ("Webapp", webapp_result)]:
        color = "green" if result.ok else "red"
        click.echo(click.style(f"[{name}] {'OK' if result.ok else 'FAIL'} — {result.detail}", fg=color))

    if not (api_result.ok and webapp_result.ok):
        sys.exit(1)


@cli.command("deploy-gate-check")
@click.option("--base-url", default="http://localhost:4000")
@click.option("--admin-email", required=True, help="An already-provisioned Admin-role staff account.")
@click.option("--admin-name", default="Deploy Pipeline")
@click.pass_context
def deploy_gate_check(ctx: click.Context, base_url: str, admin_email: str, admin_name: str):
    """ADR020's hard CI/CD gate, run as an actual pipeline step: exits
    non-zero (failing the build) if any tracked AI model is blocked.
    """
    result = gate.check_deploy_gate(base_url, admin_email, admin_name)
    click.echo(click.style(result.detail, fg="green" if result.passed else "red"))
    if not result.passed:
        sys.exit(1)


if __name__ == "__main__":
    cli()
