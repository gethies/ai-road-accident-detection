import pytest
from fastapi.testclient import TestClient

from database import init_db
from main import app


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
