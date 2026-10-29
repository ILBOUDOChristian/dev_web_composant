# WSO2 Micro Integrator 4.6.0 — Projet Groupe 7 SI

Ce répertoire contient les artefacts d'intégration pour le transfert et la normalisation des produits.

## Structure

- `src/main/wso2mi/artifacts` : API Synapse (`ProductTransferAPI.xml`) et Connecteurs.
- `deployment/` : Configuration et bibliothèques (drivers JDBC).
- `pom.xml` : Configuration Maven pour la construction de l'image Docker.

## Construction de l'image Docker

Depuis la racine du projet, Compose construit WSO2 dans un conteneur Maven :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml build wso2
```

Cette procédure ne nécessite ni JDK ni Maven sur la machine hôte. Elle utilise
la valeur `WSO2_KEYSTORE_PASSWORD` du fichier `.env` comme argument de build.

La construction Maven directe reste possible pour le développement local, mais
elle nécessite alors JDK 21 :

## Déploiement

Une fois l'image construite, recréer le conteneur dans l'assemblage :
```powershell
docker compose -f ../docker-compose.yml -f ../docker-compose.dev.yml up -d --force-recreate wso2
```

## Gestion des erreurs (Fault Sequence)

L'API renvoie désormais des codes HTTP explicites :
- `200 OK` : Transfert réussi.
- `404 Not Found` : SKU absent dans la base source.
- `500 Internal Server Error` : Erreur technique (ex: connexion DB).
