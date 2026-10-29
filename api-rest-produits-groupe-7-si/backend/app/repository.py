from collections.abc import Callable
from os import environ
from typing import Any, Protocol

import psycopg
from psycopg.rows import dict_row

from .schemas import ProductCreate, ProductUpdate


class ProductRepository(Protocol):
    def list(self) -> list[dict[str, Any]]: ...

    def get(self, product_id: int) -> dict[str, Any] | None: ...

    def create(self, product: ProductCreate) -> dict[str, Any]: ...

    def update(self, product_id: int, product: ProductUpdate) -> dict[str, Any] | None: ...

    def delete(self, product_id: int) -> bool: ...


class PostgresProductRepository:
    def __init__(self, connection_factory: Callable[..., Any]) -> None:
        self._connection_factory = connection_factory

    @classmethod
    def from_environment(cls) -> "PostgresProductRepository":
        required = ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")
        missing = [name for name in required if not environ.get(name)]
        if missing:
            raise RuntimeError(
                f"Missing database environment variables: {', '.join(missing)}"
            )

        def connect() -> Any:
            return psycopg.connect(
                host=environ["DB_HOST"],
                port=environ["DB_PORT"],
                dbname=environ["DB_NAME"],
                user=environ["DB_USER"],
                password=environ["DB_PASSWORD"],
                row_factory=dict_row,
            )

        return cls(connect)

    def list(self) -> list[dict[str, Any]]:
        with self._connection_factory() as connection:
            return list(
                connection.execute(
                    """
                    SELECT id, sku, name, description, price, stock,
                           created_at::text, updated_at::text
                    FROM cible.products
                    ORDER BY id
                    """
                ).fetchall()
            )

    def get(self, product_id: int) -> dict[str, Any] | None:
        with self._connection_factory() as connection:
            return connection.execute(
                """
                SELECT id, sku, name, description, price, stock,
                       created_at::text, updated_at::text
                FROM cible.products
                WHERE id = %s
                """,
                (product_id,),
            ).fetchone()

    def create(self, product: ProductCreate) -> dict[str, Any]:
        with self._connection_factory() as connection:
            return connection.execute(
                """
                INSERT INTO cible.products (sku, name, description, price, stock)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, sku, name, description, price, stock,
                          created_at::text, updated_at::text
                """,
                (
                    product.sku,
                    product.name,
                    product.description,
                    product.price,
                    product.stock,
                ),
            ).fetchone()

    def update(self, product_id: int, product: ProductUpdate) -> dict[str, Any] | None:
        with self._connection_factory() as connection:
            return connection.execute(
                """
                UPDATE cible.products
                SET sku = %s, name = %s, description = %s,
                    price = %s, stock = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, sku, name, description, price, stock,
                          created_at::text, updated_at::text
                """,
                (
                    product.sku,
                    product.name,
                    product.description,
                    product.price,
                    product.stock,
                    product_id,
                ),
            ).fetchone()

    def delete(self, product_id: int) -> bool:
        with self._connection_factory() as connection:
            result = connection.execute(
                "DELETE FROM cible.products WHERE id = %s",
                (product_id,),
            )
            return result.rowcount == 1