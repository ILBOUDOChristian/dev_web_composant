# 2. Initialisation PostgreSQL

PostgreSQL fournit la base `products_db` et les deux schémas métier.

## Fichiers essentiels

- [docker-compose.yml](../docker-compose.yml) : déclare le service PostgreSQL,
  le volume et le healthcheck.
- [schema.sql](../sql/schema.sql) : crée les schémas, tables et contraintes.
- [seed.sql](../sql/seed.sql) : insère les produits de démonstration dans
  `source.products`.

## Démarrage

```powershell
docker compose up -d db
docker compose ps db
```

Le service doit être `healthy`.

Le fichier `docker-compose.yml` monte automatiquement `schema.sql` et
`seed.sql` lors de la toute première création du volume PostgreSQL. Si le
volume existe déjà, les scripts d'initialisation ne sont pas rejoués.

Connexion depuis Windows :

```powershell
docker compose exec -T db psql -U products_user -d products_db
```

Connexion depuis un autre conteneur :

```text
host=db
port=5432
database=products_db
user=products_user
```

Pour réinitialiser complètement la base de démonstration :

```powershell
docker compose down -v
docker compose up -d db
```

Cette opération supprime le volume et toutes les données locales.

Les données suivent ce modèle :

```text
source.products -> flux WSO2 -> cible.products -> API Python
```

`source.products` contient les données d'origine. `cible.products` contient
les données transférées et exposées par l'API CRUD.

## Diagnostic PostgreSQL

```powershell
docker compose logs db
docker compose ps db
docker compose exec -T db pg_isready -U products_user -d products_db
```

Si le port `5434` est occupé, consulter
[01-configuration.md](01-configuration.md). Si le service reste `unhealthy`,
vérifier le mot de passe et le nom de base dans `.env`, puis consulter les
logs avant de supprimer le volume.
