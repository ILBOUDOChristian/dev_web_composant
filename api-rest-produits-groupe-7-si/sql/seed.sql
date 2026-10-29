INSERT INTO source.products (sku, name, description, price, stock)
VALUES
    ('KB-001', '  Clavier USB  ', 'Clavier filaire de démonstration', 19.90, 25),
    ('MS-002', 'Souris optique', 'Souris USB de démonstration', 12.50, 40),
    ('HD-003', 'Disque externe', 'Disque externe de démonstration', 64.99, 10)
ON CONFLICT (sku) DO NOTHING;