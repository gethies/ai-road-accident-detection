"""Basic API tests with mocked detection."""

import io

import pytest


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_incidents(client):
    r = client.get("/api/incidents")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_stats(client):
    r = client.get("/api/stats")
    assert r.status_code == 200
    data = r.json()
    assert "total_this_week" in data


def test_create_incident(client):
    r = client.post(
        "/api/incidents",
        json={
            "lat": 13.0827,
            "lng": 80.2707,
            "severity": "MODERATE",
            "vehicleTypes": ["Car"],
        },
    )
    assert r.status_code == 200
    assert "id" in r.json()


def test_detect_upload(client):
    img = io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 100)
    r = client.post(
        "/api/detect",
        files={"image": ("test.jpg", img, "image/jpeg")},
        data={"lat": "13.0", "lng": "80.0"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "severity" in data
    assert "annotated_image_url" in data
