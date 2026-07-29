-- DO szerver patch:
-- 1. is_inactive oszlop hozzáadása partner_identifiers táblához
ALTER TABLE partner_identifiers ADD COLUMN IF NOT EXISTS is_inactive BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Delgafruits S.L. (DO szerveren ID: 1027) Reference azonosítójának biztosítása
-- (A partners_by_role lekérdezés DELGAFRUITS értéket keres)
INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'DELGAFRUITS', false, NOW(), NOW()
FROM partners
WHERE UPPER(name) LIKE '%DELGAFRUIT%'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers
  WHERE partner_id = partners.id
  AND id_type = '(Reference) Szállítók'
  AND value = 'DELGAFRUITS'
)
LIMIT 1;

-- Ellenőrzés
SELECT p.id, p.name, pi.id_type, pi.value, pi.is_inactive
FROM partner_identifiers pi
JOIN partners p ON p.id = pi.partner_id
WHERE UPPER(pi.value) LIKE '%DELGA%';
