from unittest.mock import patch, MagicMock

import requests

from deploy.healthcheck import check_health, check_webapp_served


def _mock_response(status_code=200, json_data=None, text=""):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data if json_data is not None else {}
    resp.text = text
    return resp


def test_check_health_ok():
    with patch("deploy.healthcheck.requests.get", return_value=_mock_response(200, {"status": "ok"})) as mock_get:
        result = check_health("http://localhost:4000")
    assert result.ok is True
    mock_get.assert_called_once_with("http://localhost:4000/api/health", timeout=5.0)


def test_check_health_wrong_body():
    with patch("deploy.healthcheck.requests.get", return_value=_mock_response(200, {"status": "degraded"})):
        result = check_health("http://localhost:4000")
    assert result.ok is False
    assert "unexpected body" in result.detail


def test_check_health_non_200():
    with patch("deploy.healthcheck.requests.get", return_value=_mock_response(500, {})):
        result = check_health("http://localhost:4000")
    assert result.ok is False
    assert result.status_code == 500


def test_check_health_connection_error():
    with patch("deploy.healthcheck.requests.get", side_effect=requests.ConnectionError("refused")):
        result = check_health("http://localhost:9999")
    assert result.ok is False
    assert result.status_code is None
    assert "could not reach" in result.detail


def test_check_webapp_served_ok():
    resp = _mock_response(200, text="<title>Platform Home</title>")
    with patch("deploy.healthcheck.requests.get", return_value=resp):
        result = check_webapp_served("http://localhost:4000")
    assert result.ok is True


def test_check_webapp_served_wrong_content():
    resp = _mock_response(200, text="<h1>Not the app</h1>")
    with patch("deploy.healthcheck.requests.get", return_value=resp):
        result = check_webapp_served("http://localhost:4000")
    assert result.ok is False
