-- 1. Karakterkódolási hibák (rossz id_type) javítása
UPDATE partner_identifiers SET id_type = '(Reference) Szállítók' WHERE id_type LIKE '%Reference%' AND id_type != '(Reference) Szállítók';
UPDATE partner_identifiers SET id_type = '(Customer) Vevők' WHERE id_type LIKE '%Customer%' AND id_type != '(Customer) Vevők';
UPDATE partner_identifiers SET id_type = 'Fuvarozók' WHERE id_type LIKE '%Fuvaro%' AND id_type != 'Fuvarozók';

-- 2. Duplikátumok törlése az ÖSSZES id_type-ban

  DELETE FROM partner_identifiers
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY partner_id, id_type, value ORDER BY id) as rn
      FROM partner_identifiers
    ) t
    WHERE t.rn > 1
  );