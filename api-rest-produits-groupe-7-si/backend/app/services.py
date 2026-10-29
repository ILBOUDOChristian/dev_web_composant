from typing import Any

from .repository import ProductRepository
from .schemas import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, repository: ProductRepository) -> None:
        self.repository = repository

    def list_products(self) -> list[dict[str, Any]]:
        return self.repository.list()

    def get_product(self, product_id: int) -> dict[str, Any] | None:
        return self.repository.get(product_id)

    def create_product(self, product: ProductCreate) -> dict[str, Any]:
        return self.repository.create(product)

    def update_product(
        self, product_id: int, product: ProductUpdate
    ) -> dict[str, Any] | None:
        return self.repository.update(product_id, product)

    def delete_product(self, product_id: int) -> bool:
        return self.repository.delete(product_id)