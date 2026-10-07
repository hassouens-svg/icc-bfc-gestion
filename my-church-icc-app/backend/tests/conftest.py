import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ["DATABASE_URL"] = "sqlite:///./test_icc.db"
os.environ["SEED_DEMO_DATA"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as c:
        token = c.post("/api/auth/login", json={"username": "admin", "password": "admin123"}).json()["token"]
        c.headers["Authorization"] = f"Bearer {token}"
        yield c
    Base.metadata.drop_all(bind=engine)
