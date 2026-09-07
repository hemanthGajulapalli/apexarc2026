"""The golden-set deploy gate (ADR011, ADR020) as a real pipeline step —
this is what a CI/CD job would actually run before promoting a build: fail
the pipeline if any tracked AI model is `blocked` (its latest golden-set
run failed and no override is on record). This does not replace the API's
own enforcement (implementation/server/src/services/ai-governance/routes.js
rejects a bad promote regardless of what any script does) — it's the
pipeline-side check that stops a deploy *before* someone tries.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import requests


@dataclass
class GateResult:
    passed: bool
    blocked_models: list[str] = field(default_factory=list)
    detail: str = ""


def _signin(base_url: str, email: str, display_name: str, timeout: float) -> str:
    resp = requests.post(
        f"{base_url.rstrip('/')}/api/auth/signin",
        json={"provider": "estate", "email": email, "displayName": display_name, "kind": "staff"},
        timeout=timeout,
    )
    resp.raise_for_status()
    return resp.json()["token"]


def check_deploy_gate(
    base_url: str,
    admin_email: str,
    admin_display_name: str = "Deploy Pipeline",
    timeout: float = 5.0,
) -> GateResult:
    """Signs in as the given (already-provisioned, Admin-role) staff
    account and asks the real API for the model registry — the exact same
    endpoint the AI Governance Console webapp calls. A model only shows as
    `blocked` here if the API itself has no passing golden-set run AND no
    recorded override for it; this script trusts that state rather than
    re-deriving it, since the API is the single source of truth (ADR011).
    """
    try:
        token = _signin(base_url, admin_email, admin_display_name, timeout)
    except requests.RequestException as exc:
        return GateResult(passed=False, detail=f"could not sign in as {admin_email}: {exc}")

    try:
        resp = requests.get(
            f"{base_url.rstrip('/')}/api/ai-governance/models",
            headers={"Authorization": f"Bearer {token}"},
            timeout=timeout,
        )
        resp.raise_for_status()
        models = resp.json()
    except requests.RequestException as exc:
        return GateResult(passed=False, detail=f"could not fetch model registry: {exc}")

    blocked = [f"{m['name']} {m['version']}" for m in models if m.get("status") == "blocked"]

    if blocked:
        return GateResult(
            passed=False,
            blocked_models=blocked,
            detail=(
                "Deploy gate FAILED (ADR020): the following models have a failing "
                "golden-set result with no recorded override — "
                + ", ".join(blocked)
                + ". Either fix the model or record an explicit override via the "
                "AI Governance Console before deploying."
            ),
        )

    return GateResult(passed=True, detail=f"Deploy gate PASSED — {len(models)} model(s) tracked, none blocked.")
