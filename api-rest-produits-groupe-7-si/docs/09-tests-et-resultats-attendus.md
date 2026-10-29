# Scénarios de Test et Résultats Attendus

Ce document détaille les scénarios de test fonctionnels de bout en bout pour le projet **API REST de produits avec Python et WSO2 Micro Integrator** (SI Groupe 7 - Thème 10).

---

## 1. Matrice des Scénarios de Test

| Réf. | Composant testé | Méthode / Protocole | Endpoint / Commande | Objectif du test | Résultat attendu |
|---|---|---|---|---|---|
| **SC-01** | Base de données | SQL (psql) | `SELECT count(*) FROM source.products;` | Vérification de la disponibilité et chargement du jeu d'essai source | 2 lignes retournées (produits sources insérés) |
| **SC-02** | WSO2 Micro Integrator | HTTP POST | `POST http://localhost:8291/transfer` | Déclenchement de la médiation, normalisation des noms et transfert source -> cible | Code `200 OK`, JSON indiquant le succès du transfert |
| **SC-03** | Base de données | SQL (psql) | `SELECT * FROM cible.products;` | Contrôle de la persistance des données transformées | Produits présents dans `cible`, noms en majuscules / format normalisé |
| **SC-04** | API Python (FastAPI) | HTTP GET | `GET http://localhost:8001/health` | Contrôle de la santé opérationnelle du backend | Code `200 OK`, payload `{"status": "ok"}` |
| **SC-05** | API Python (FastAPI) | HTTP GET | `GET http://localhost:8001/api/v1/products` | Consultation de la liste des produits synchronisés | Code `200 OK`, liste JSON des produits de la base cible |
| **SC-06** | API Python (FastAPI) | HTTP POST | `POST http://localhost:8001/api/v1/products` | Création d'un nouveau produit via l'API | Code `201 Created`, produit retourné avec son identifiant généré |
| **SC-07** | API Python (FastAPI) | HTTP GET | `GET http://localhost:8001/api/v1/products/{id}` | Recherche d'un produit par son identifiant | Code `200 OK` si existant, code `404 Not Found` si inexistant |
| **SC-08** | API Python (FastAPI) | HTTP PUT | `PUT http://localhost:8001/api/v1/products/{id}` | Modification des attributs d'un produit (prix, stock) | Code `200 OK`, produit mis à jour avec date `updated_at` réactualisée |
| **SC-09** | API Python (FastAPI) | HTTP DELETE | `DELETE http://localhost:8001/api/v1/products/{id}` | Suppression d'un produit du catalogue cible | Code `204 No Content`, suppression effective |
| **SC-10** | Interface Utilisateur | Web Browser | `http://localhost:3001` | Visualisation globale et déclenchement interactif | Tableaux synchronisés et actualisés sans rechargement complet |

---

## 2. Déroulement du Scénario de Bout en Bout

### Étape 1 : État initial (Source)
- La table `source.products` contient les données brutes initiales :
  - `KB-001` : Clavier Mécanique (prix: 59.99, stock: 25)
  - `MS-002` : Souris Ergonomique (prix: 29.50, stock: 40)
- La table `cible.products` est initialement vide.

### Étape 2 : Déclenchement WSO2 MI
- Une requête `POST` est adressée à l'API de transfert WSO2 (`:8291/transfer`).
- La médiation extrait les données de `source.products`, applique les règles de correspondance et de normalisation, puis les charge dans `cible.products`.
- Réponse obtenue :
```json
{
  "status": "success",
  "transferred_records": 2,
  "timestamp": "2026-10-28T23:55:00Z"
}
```

### Étape 3 : Consultation et gestion via l'API Python
- Appel de `GET /api/v1/products` sur le port `8001` :
  - Les 2 produits normalisés apparaissent bien dans le flux JSON avec leurs identifiants cibles.
- Appel de `POST /api/v1/products` :
  - Ajout manuel d'une référence immédiate `EC-003` (Écran 27 pouces) : confirmation `201 Created`.
- Relecture `GET /api/v1/products` : 3 produits au total.

---

## 3. Validation par la suite Insomnia

La collection de tests automatisés fournie dans `tests/insomnia/products.json` a été exécutée pour valider l'ensemble des statuts HTTP et payloads :
- Tous les tests de validation de statut (`200`, `201`, `204`, `404`) sont conformes.
- Le contrat OpenAPI disponible dans `docs/openapi.json` correspond strictement aux formats de données échangés.

