"""Post-deploy smoke test — hits the real running API exactly like a CI/CD
pipeline step would (ADR020), no auth required for /api/health by design.
"""
from __future__ import annotations

from dataclasses import dataclass

import requests


@dataclass
class HealthResult:
    ok: bool
    status_code: int | None
    detail: str


def check_health(base_url: str, timeout: float = 5.0) -> HealthResult:
    url = f"{base_url.rstrip('/')}/api/health"
    try:
        resp = requests.get(url, timeout=timeout)
    except requests.RequestException as exc:
        return HealthResult(ok=False, status_code=None, detail=f"could not reach {url}: {exc}")

    if resp.status_code != 200:
        return HealthResult(ok=False, status_code=resp.status_code, detail=f"unexpected status from {url}")

    try:
        body = resp.json()
    except ValueError:
        return HealthResult(ok=False, status_code=resp.status_code, detail="response was not valid JSON")

    if body.get("status") != "ok":
        return HealthResult(ok=False, status_code=resp.status_code, detail=f"unexpected body: {body}")

    return HealthResult(ok=True, status_code=200, detail="healthy")


def check_webapp_served(base_url: str, timeout: float = 5.0) -> HealthResult:
    """The API and the webapp are served by the same process
    (implementation/server/src/app.js) — confirm the static files are
    actually being served too, not just the API route table.
    """
    url = f"{base_url.rstrip('/')}/index.html"
    try:
        resp = requests.get(url, timeout=timeout)
    except requests.RequestException as exc:
        return HealthResult(ok=False, status_code=None, detail=f"could not reach {url}: {exc}")

    if resp.status_code != 200 or "Platform Home" not in resp.text:
        return HealthResult(ok=False, status_code=resp.status_code, detail="webapp did not serve the expected sign-in page")

    return HealthResult(ok=True, status_code=200, detail="webapp served")
