# 7. Tests Insomnia

Insomnia permet de rejouer les scénarios HTTP de l'API Python et de WSO2.

## Fichier essentiel

- [products.json](../tests/insomnia/products.json) : collection exportée.

Importer ce fichier dans Insomnia. Les variables sont :

```text
python_base_url = http://localhost:8001
wso2_base_url   = http://localhost:8291
```

## Ordre recommandé

1. `Python - Health`
2. `Python - List products`
3. `Python - Create product`
4. Remplacer `REPLACE_ID` par l'identifiant créé
5. `Python - Update product`
6. `Python - Delete product`
7. `WSO2 - Transfer product`

Après les tests CRUD, supprimer les données temporaires afin de conserver les
trois produits de démonstration dans la base.
