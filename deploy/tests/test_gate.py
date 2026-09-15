from unittest.mock import patch, MagicMock

import requests

from deploy.gate import check_deploy_gate


def _resp(status_code=200, json_data=None):
    r = MagicMock()
    r.status_code = status_code
    r.json.return_value = json_data
    r.raise_for_status.side_effect = (
        requests.HTTPError(f"{status_code}") if status_code >= 400 else None
    )
    return r


def test_gate_passes_when_no_model_blocked():
    signin_resp = _resp(200, {"token": "t"})
    models_resp = _resp(200, [
        {"name": "Health & Feeding AI", "version": "v7.2", "status": "production"},
        {"name": "Piranha-Count", "version": "v3.1", "status": "production"},
    ])
    with patch("deploy.gate.requests.post", return_value=signin_resp), \
         patch("deploy.gate.requests.get", return_value=models_resp):
        result = check_deploy_gate("http://localhost:4000", "priya.nair@vondigitalis.example")

    assert result.passed is True
    assert result.blocked_models == []


def test_gate_fails_when_a_model_is_blocked():
    # Mirrors the real seeded scenario: Piranha-Count v3.2 blocked.
    signin_resp = _resp(200, {"token": "t"})
    models_resp = _resp(200, [
        {"name": "Health & Feeding AI", "version": "v7.2", "status": "production"},
        {"name": "Piranha-Count", "version": "v3.1", "status": "production"},
        {"name": "Piranha-Count", "version": "v3.2", "status": "blocked"},
    ])
    with patch("deploy.gate.requests.post", return_value=signin_resp), \
         patch("deploy.gate.requests.get", return_value=models_resp):
        result = check_deploy_gate("http://localhost:4000", "priya.nair@vondigitalis.example")

    assert result.passed is False
    assert result.blocked_models == ["Piranha-Count v3.2"]
    assert "ADR020" in result.detail


def test_gate_fails_closed_on_signin_error():
    with patch("deploy.gate.requests.post", side_effect=requests.ConnectionError("refused")):
        result = check_deploy_gate("http://localhost:9999", "priya.nair@vondigitalis.example")

    assert result.passed is False
    assert "could not sign in" in result.detail


def test_gate_fails_closed_on_registry_fetch_error():
    signin_resp = _resp(200, {"token": "t"})
    with patch("deploy.gate.requests.post", return_value=signin_resp), \
         patch("deploy.gate.requests.get", side_effect=requests.ConnectionError("refused")):
        result = check_deploy_gate("http://localhost:4000", "priya.nair@vondigitalis.example")

    assert result.passed is False
    assert "could not fetch model registry" in result.detail
