"""Test de bout en bout de la chaîne principale.

Ce test traverse l'ensemble de la chaîne du projet :

    client HTTP -> WSO2 Micro Integrator -> PostgreSQL (source.products -> cible.products)
    client HTTP -> API Python (FastAPI)  -> PostgreSQL (cible.products)

Prérequis : la pile doit être démarrée et saine.

    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

Exécution depuis le dossier `backend` :

    python -m pytest tests/test_e2e.py -v

Si le backend ou WSO2 n'est pas joignable, ces tests sont ignorés (skipped)
afin que `pytest` reste vert sur un poste sans Docker. Les ports peuvent être
surchargés avec les variables `E2E_BACKEND_URL` et `E2E_WSO2_URL`.
"""

import os
import uuid
from decimal import Decimal

import httpx
import pytest

BACKEND_URL = os.environ.get("E2E_BACKEND_URL", "http://localhost:8001")
WSO2_URL = os.environ.get("E2E_WSO2_URL", "http://localhost:8291")
TIMEOUT = httpx.Timeout(20.0)

# Produit présent dans source.products par sql/seed.sql, dont le nom contient
# des espaces volontaires ('  Clavier USB  ') pour valider la transformation WSO2.
SEED_SKU = "KB-001"
SEED_NAME_NORMALIZED = "Clavier USB"


def _reachable(url: str) -> bool:
    try:
        httpx.get(url, timeout=3.0)
        return True
    except httpx.HTTPError:
        return False


pytestmark = pytest.mark.skipif(
    not (_reachable(f"{BACKEND_URL}/health") and _reachable(f"{WSO2_URL}/products/transfer")),
    reason="pile Docker non démarrée (backend ou WSO2 injoignable)",
)


def _find_by_sku(sku: str) -> dict | None:
    response = httpx.get(f"{BACKEND_URL}/api/v1/products", timeout=TIMEOUT)
    response.raise_for_status()
    return next((item for item in response.json() if item["sku"] == sku), None)


def _delete_by_sku(sku: str) -> None:
    product = _find_by_sku(sku)
    if product is not None:
        httpx.delete(
            f"{BACKEND_URL}/api/v1/products/{product['id']}", timeout=TIMEOUT
        ).raise_for_status()


def test_scenario_fonctionnel_transfert_wso2():
    """Scénario fonctionnel : transfert d'un produit de la source vers la cible."""
    _delete_by_sku(SEED_SKU)

    response = httpx.post(
        f"{WSO2_URL}/products/transfer", json={"sku": SEED_SKU}, timeout=TIMEOUT
    )

    assert response.status_code == 200
    assert 'status="transferred"' in response.text

    transferred = _find_by_sku(SEED_SKU)
    assert transferred is not None
    # fn:normalize-space supprime les espaces du nom lors de la transformation.
    assert transferred["name"] == SEED_NAME_NORMALIZED
    assert Decimal(str(transferred["price"])) == Decimal("19.90")


def test_chaine_complete_insomnia_wso2_postgres_api():
    """Chaîne complète : CRUD API Python + transfert WSO2 + contrôle de la cible."""
    sku = f"E2E-{uuid.uuid4().hex[:8].upper()}"
    product_id = None

    try:
        # 1. Création par l'API Python (cible.products).
        created = httpx.post(
            f"{BACKEND_URL}/api/v1/products",
            json={
                "sku": sku,
                "name": "Produit E2E",
                "description": "créé par le test de bout en bout",
                "price": "9.99",
                "stock": 3,
            },
            timeout=TIMEOUT,
        )
        assert created.status_code == 201
        product_id = created.json()["id"]

        # 2. Lecture.
        read = httpx.get(
            f"{BACKEND_URL}/api/v1/products/{product_id}", timeout=TIMEOUT
        )
        assert read.status_code == 200
        assert read.json()["sku"] == sku

        # 3. Mise à jour.
        updated = httpx.put(
            f"{BACKEND_URL}/api/v1/products/{product_id}",
            json={
                "sku": sku,
                "name": "Produit E2E (modifié)",
                "description": None,
                "price": "12.50",
                "stock": 7,
            },
            timeout=TIMEOUT,
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Produit E2E (modifié)"
        assert Decimal(str(updated.json()["price"])) == Decimal("12.50")

        # 4. SKU déjà utilisé -> 409.
        conflict = httpx.post(
            f"{BACKEND_URL}/api/v1/products",
            json={"sku": sku, "name": "Doublon", "price": "1.00", "stock": 1},
            timeout=TIMEOUT,
        )
        assert conflict.status_code == 409

        # 5. Corps invalide -> 422.
        invalid = httpx.post(
            f"{BACKEND_URL}/api/v1/products",
            json={"sku": "", "name": "", "price": -1, "stock": -1},
            timeout=TIMEOUT,
        )
        assert invalid.status_code == 422

        # 6. Transfert WSO2 d'un SKU absent de la source -> 404.
        missing = httpx.post(
            f"{WSO2_URL}/products/transfer",
            json={"sku": "SKU-INEXISTANT"},
            timeout=TIMEOUT,
        )
        assert missing.status_code == 404
        assert 'status="not_found"' in missing.text

        # 7. Le produit reste consultable après le transfert WSO2.
        httpx.post(
            f"{WSO2_URL}/products/transfer", json={"sku": SEED_SKU}, timeout=TIMEOUT
        )
        assert httpx.get(
            f"{BACKEND_URL}/api/v1/products/{product_id}", timeout=TIMEOUT
        ).status_code == 200
    finally:
        if product_id is not None:
            httpx.delete(
                f"{BACKEND_URL}/api/v1/products/{product_id}", timeout=TIMEOUT
            )
