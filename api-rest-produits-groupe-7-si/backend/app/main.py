from os import environ
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from psycopg import IntegrityError

from .repository import PostgresProductRepository
from .schemas import Product, ProductCreate, ProductUpdate
from .services import ProductService

app = FastAPI(title="Products API", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in environ.get(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_product_service() -> ProductService:
    return ProductService(PostgresProductRepository.from_environment())


ServiceDependency = Annotated[ProductService, Depends(get_product_service)]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/products", response_model=list[Product])
def list_products(service: ServiceDependency) -> list[dict]:
    return service.list_products()


@app.get("/api/v1/products/{product_id}", response_model=Product)
def get_product(product_id: int, service: ServiceDependency) -> dict:
    product = service.get_product(product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@app.post(
    "/api/v1/products",
    response_model=Product,
    status_code=status.HTTP_201_CREATED,
)
def create_product(product: ProductCreate, service: ServiceDependency) -> dict:
    try:
        return service.create_product(product)
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this SKU already exists",
        ) from error


@app.put("/api/v1/products/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    product: ProductUpdate,
    service: ServiceDependency,
) -> dict:
    try:
        updated = service.update_product(product_id, product)
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this SKU already exists",
        ) from error
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return updated


@app.delete("/api/v1/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, service: ServiceDependency) -> None:
    if not service.delete_product(product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")