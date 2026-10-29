from datetime import datetime
from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app, get_product_service
from app.services import ProductService


def product(product_id: int = 1, sku: str = "KB-001") -> dict:
    now = datetime.now().isoformat()
    return {
        "id": product_id,
        "sku": sku,
        "name": "Clavier USB",
        "description": "Test product",
        "price": Decimal("19.90"),
        "stock": 10,
        "created_at": now,
        "updated_at": now,
    }


class FakeRepository:
    def __init__(self) -> None:
        self.products = {1: product()}

    def list(self) -> list[dict]:
        return list(self.products.values())

    def get(self, product_id: int) -> dict | None:
        return self.products.get(product_id)

    def create(self, item) -> dict:
        created = product(2, item.sku)
        created.update(item.model_dump())
        self.products[2] = created
        return created

    def update(self, product_id: int, item) -> dict | None:
        if product_id not in self.products:
            return None
        updated = self.products[product_id]
        updated.update(item.model_dump())
        return updated

    def delete(self, product_id: int) -> bool:
        return self.products.pop(product_id, None) is not None


def client() -> TestClient:
    app.dependency_overrides[get_product_service] = lambda: ProductService(FakeRepository())
    return TestClient(app)


def test_health() -> None:
    response = client().get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_products() -> None:
    response = client().get("/api/v1/products")
    assert response.status_code == 200
    assert response.json()[0]["sku"] == "KB-001"


def test_get_missing_product() -> None:
    response = client().get("/api/v1/products/999")
    assert response.status_code == 404


def test_create_product() -> None:
    response = client().post(
        "/api/v1/products",
        json={
            "sku": "MS-002",
            "name": "Souris",
            "description": None,
            "price": "12.50",
            "stock": 4,
        },
    )
    assert response.status_code == 201
    assert response.json()["sku"] == "MS-002"


def test_update_product() -> None:
    response = client().put(
        "/api/v1/products/1",
        json={
            "sku": "KB-001",
            "name": "Clavier mis à jour",
            "description": None,
            "price": "20.00",
            "stock": 8,
        },
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Clavier mis à jour"


def test_delete_product() -> None:
    response = client().delete("/api/v1/products/1")
    assert response.status_code == 204