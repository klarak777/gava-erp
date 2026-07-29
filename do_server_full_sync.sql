-- DO Szerver Teljes Szerepkör Szinkronizáló SQL script
-- Generálva a lokális tesztkörnyezetből

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGROPONIENTE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'AGROPONIENTE S.A.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGROPONIENTE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGROPONIENTE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'AGROPONIENTE S.A.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'OLASO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'OLASO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('OLASO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('OLASO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'OLASO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'WRAPPING', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'WRAPPING'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('WRAPPING')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('WRAPPING') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'WRAPPING');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'ESCOBI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ESCOBI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('ESCOBI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('ESCOBI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ESCOBI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGROPONIENTE NIJAR', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'AGROPONIENTE NIJAR'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGROPONIENTE NIJAR')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGROPONIENTE NIJAR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'AGROPONIENTE NIJAR');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CASI AIRPORT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASI AIRPORT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CASI AIRPORT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CASI AIRPORT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASI AIRPORT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AXAFRUIT', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Axarfruit'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AXAFRUIT')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AXAFRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Axarfruit');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AXARFRUIT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Axarfruit'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AXARFRUIT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AXARFRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Axarfruit');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EXPOALMA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Expoalma S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EXPOALMA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EXPOALMA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Expoalma S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'COMPAGRI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'COMPAGRI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('COMPAGRI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('COMPAGRI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'COMPAGRI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CASI AEROPORTO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASI AEROPORTO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CASI AEROPORTO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CASI AEROPORTO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASI AEROPORTO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'DG69', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'DG69'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('DG69')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('DG69') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DG69');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'DG69', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'DG69'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('DG69')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('DG69') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DG69');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGROPONIENTE NIJAR', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Agroponiente Natural Produce S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGROPONIENTE NIJAR')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGROPONIENTE NIJAR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Agroponiente Natural Produce S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGROPONIENTE', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Agroponiente Natural Produce S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGROPONIENTE')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGROPONIENTE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Agroponiente Natural Produce S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGRPONIENTE', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Agroponiente Natural Produce S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGRPONIENTE')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGRPONIENTE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Agroponiente Natural Produce S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGROPONIENTE NATURAL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Agroponiente Natural Produce S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGROPONIENTE NATURAL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGROPONIENTE NATURAL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Agroponiente Natural Produce S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HANKA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'HANKA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HANKA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HANKA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HANKA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ENGELAN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ENGELAN'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ENGELAN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ENGELAN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ENGELAN');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'KUSEK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KUSEK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('KUSEK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('KUSEK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KUSEK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KUSEK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KUSEK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KUSEK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KUSEK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KUSEK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'R&M', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'R&M'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('R&M')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('R&M') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'R&M');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'R&M', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'R&M'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('R&M')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('R&M') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'R&M');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'SPAR HU', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SPAR HU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('SPAR HU')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('SPAR HU') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SPAR HU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'SPAR HU', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SPAR HU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('SPAR HU')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('SPAR HU') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SPAR HU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CASI AIRPORT', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CASI AIRPORT')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CASI AIRPORT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CASI AEROPORTO', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CASI AEROPORTO')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CASI AEROPORTO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CASI ARIPORT', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CASI ARIPORT')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CASI ARIPORT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CASI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CASI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CASI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CASI PARTIDORES', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASI PARTIDORES'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CASI PARTIDORES')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CASI PARTIDORES') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASI PARTIDORES');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'ESCOFRESH', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ESCOFRESH'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('ESCOFRESH')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('ESCOFRESH') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ESCOFRESH');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'FRANIAL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRANIAL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('FRANIAL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('FRANIAL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRANIAL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'FRESSAN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRESSAN'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('FRESSAN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('FRESSAN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRESSAN');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'GAVA', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRUTAS GAVA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('GAVA')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('GAVA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRUTAS GAVA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'GAVA', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRUTAS GAVA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('GAVA')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('GAVA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRUTAS GAVA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GAVA', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRUTAS GAVA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GAVA')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GAVA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRUTAS GAVA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'FRUTAS GAVA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRUTAS GAVA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('FRUTAS GAVA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('FRUTAS GAVA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRUTAS GAVA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GALLARDO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GALLARDO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GALLARDO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GALLARDO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GALLARDO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GREEN QUALITY', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GREEN QUALITY'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GREEN QUALITY')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GREEN QUALITY') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GREEN QUALITY');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'VEGACANADA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VEGACANADA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('VEGACANADA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('VEGACANADA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VEGACANADA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'CORD', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CORD'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('CORD')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('CORD') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CORD');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CORD', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CORD'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CORD')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CORD') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CORD');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EUROGROUP ESPANA', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'EUROGROUP ESPANA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EUROGROUP ESPANA')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EUROGROUP ESPANA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EUROGROUP ESPANA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'EUROGROUP ES', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'EUROGROUP ESPANA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('EUROGROUP ES')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('EUROGROUP ES') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EUROGROUP ESPANA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'EUROGROUP', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'EUROGROUP ESPANA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('EUROGROUP')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('EUROGROUP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EUROGROUP ESPANA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EUROGROUP ES', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'EUROGROUP ESPANA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EUROGROUP ES')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EUROGROUP ES') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EUROGROUP ESPANA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EUROGROUP', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'EUROGROUP ESPANA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EUROGROUP')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EUROGROUP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EUROGROUP ESPANA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'EUROGROUP ESPANA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'EUROGROUP ESPANA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('EUROGROUP ESPANA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('EUROGROUP ESPANA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EUROGROUP ESPANA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EXOTIC FRESH', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'EXOTIC FRESH'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EXOTIC FRESH')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EXOTIC FRESH') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EXOTIC FRESH');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'EXOTIC FRESH', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'EXOTIC FRESH'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('EXOTIC FRESH')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('EXOTIC FRESH') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EXOTIC FRESH');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GHU', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GHU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GHU')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GHU') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GHU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'GHU', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GHU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('GHU')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('GHU') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GHU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGRONERVION', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Agronervion, S.L.U.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGRONERVION')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGRONERVION') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Agronervion, S.L.U.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'BERTIPACK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Bertipack, S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('BERTIPACK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('BERTIPACK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Bertipack, S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GEMÜSERING', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GEMÜSERING'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GEMÜSERING')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GEMÜSERING') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GEMÜSERING');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'GEMÜSERING', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GEMÜSERING'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('GEMÜSERING')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('GEMÜSERING') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GEMÜSERING');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'GREENCOOP', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GREENCOOP'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('GREENCOOP')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('GREENCOOP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GREENCOOP');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GREENCOOP', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GREENCOOP'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GREENCOOP')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GREENCOOP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GREENCOOP');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'LEVENTE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LEVENTE'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('LEVENTE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('LEVENTE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LEVENTE');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'LEVENTE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LEVENTE'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('LEVENTE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('LEVENTE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LEVENTE');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'ROMÁNIA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ROMÁNIA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('ROMÁNIA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('ROMÁNIA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ROMÁNIA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'ROMÁNIA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ROMÁNIA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('ROMÁNIA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('ROMÁNIA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ROMÁNIA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'VILLAFRUT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VILLAFRUT SRL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('VILLAFRUT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('VILLAFRUT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VILLAFRUT SRL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'ALDI AT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ALDI AT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('ALDI AT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('ALDI AT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ALDI AT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'KV LOGISTIKA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KV LOGISTIKA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('KV LOGISTIKA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('KV LOGISTIKA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KV LOGISTIKA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AZAFAMA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Azafama Tropical LDA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AZAFAMA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AZAFAMA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Azafama Tropical LDA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'BALCANIC FOOD', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Balcanic Food Trade Company'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('BALCANIC FOOD')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('BALCANIC FOOD') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Balcanic Food Trade Company');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'RONI', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Békési Veronika'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('RONI')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('RONI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Békési Veronika');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CRETAN ROOT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Cretan Root'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CRETAN ROOT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CRETAN ROOT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Cretan Root');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CRETAN ROOT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Cretan Root'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CRETAN ROOT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CRETAN ROOT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Cretan Root');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'CRETAN ROOT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Cretan Root'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('CRETAN ROOT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('CRETAN ROOT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Cretan Root');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GAVA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GAVA TXEQUIA S.R.O.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GAVA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GAVA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GAVA TXEQUIA S.R.O.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'GAVA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GAVA TXEQUIA S.R.O.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('GAVA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('GAVA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GAVA TXEQUIA S.R.O.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'GAVA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GAVA TXEQUIA S.R.O.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('GAVA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('GAVA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GAVA TXEQUIA S.R.O.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'BOGNÁR', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Bognárné Gyöngyösi Enikő'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('BOGNÁR')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('BOGNÁR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Bognárné Gyöngyösi Enikő');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'SMART', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'BRAVOSMART Kft'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('SMART')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('SMART') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'BRAVOSMART Kft');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KOPFSALAT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KOPFSALAT TRADE SL.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KOPFSALAT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KOPFSALAT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KOPFSALAT TRADE SL.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'KOPFSALAT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KOPFSALAT TRADE SL.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('KOPFSALAT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('KOPFSALAT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KOPFSALAT TRADE SL.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'KOPFSALAT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KOPFSALAT TRADE SL.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('KOPFSALAT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('KOPFSALAT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KOPFSALAT TRADE SL.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HYBRID FRUIT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'HYBRID FRUIT Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HYBRID FRUIT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HYBRID FRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HYBRID FRUIT Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KERMOR', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Kermor Bt.......'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KERMOR')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KERMOR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Kermor Bt.......');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CHERY TIM', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CHERY TIM DISTRIBUTION SRL.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CHERY TIM')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CHERY TIM') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CHERY TIM DISTRIBUTION SRL.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CHERY TIM', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CHERY TIM DISTRIBUTION SRL.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CHERY TIM')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CHERY TIM') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CHERY TIM DISTRIBUTION SRL.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'COCO FRUITS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Coco Fruits and Vegetables S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('COCO FRUITS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('COCO FRUITS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Coco Fruits and Vegetables S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'MK FRESH', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'MK FRESH PRODUCT SARL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('MK FRESH')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('MK FRESH') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'MK FRESH PRODUCT SARL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'MK FRESH PRODUCT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'MK FRESH PRODUCT SARL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('MK FRESH PRODUCT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('MK FRESH PRODUCT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'MK FRESH PRODUCT SARL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SHEBA FRESH', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SHEBA Fresh'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SHEBA FRESH')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SHEBA FRESH') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SHEBA Fresh');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'TOMATO-AL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Tomato-Al'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('TOMATO-AL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('TOMATO-AL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Tomato-Al');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TOMATO-AL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Tomato-Al'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TOMATO-AL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TOMATO-AL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Tomato-Al');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'RONI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Roni Cargo Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('RONI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('RONI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Roni Cargo Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGRICOLA NEJITE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Agricola Nejite, S.L'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGRICOLA NEJITE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGRICOLA NEJITE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Agricola Nejite, S.L');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'ECOINVER EXPORT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Ecoinver Export S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('ECOINVER EXPORT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('ECOINVER EXPORT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Ecoinver Export S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'DELGAFRUIT', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Delgafruits S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('DELGAFRUIT')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('DELGAFRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Delgafruits S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'DELGAFRUITS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Delgafruits S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('DELGAFRUITS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('DELGAFRUITS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Delgafruits S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'DG69', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'DG 69, d.o.o., Vrhnika'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('DG69')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('DG69') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DG 69, d.o.o., Vrhnika');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'DG69', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'DG 69, d.o.o., Vrhnika'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('DG69')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('DG69') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DG 69, d.o.o., Vrhnika');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'VELASGRO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Velasgro S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('VELASGRO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('VELASGRO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Velasgro S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'ANTON DÜRBECK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Anton Dürbeck GmbH'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('ANTON DÜRBECK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('ANTON DÜRBECK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Anton Dürbeck GmbH');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'ANTON DÜRBECK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Anton Dürbeck GmbH'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('ANTON DÜRBECK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('ANTON DÜRBECK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Anton Dürbeck GmbH');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'AGRIFA LOGISTIC', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'AGRIFA LOGISTIC'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('AGRIFA LOGISTIC')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('AGRIFA LOGISTIC') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'AGRIFA LOGISTIC');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'CASAS ROYES', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASAS ROYES EXPORT S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('CASAS ROYES')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('CASAS ROYES') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASAS ROYES EXPORT S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CASAS ROYES', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CASAS ROYES EXPORT S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CASAS ROYES')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CASAS ROYES') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CASAS ROYES EXPORT S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'CLARA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CLARA EXPORT, S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('CLARA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('CLARA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CLARA EXPORT, S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'FA. DE JONG', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Fa. De Jong - Fruit'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('FA. DE JONG')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('FA. DE JONG') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Fa. De Jong - Fruit');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'GLOBAL BERRY', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Global Berry S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('GLOBAL BERRY')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('GLOBAL BERRY') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Global Berry S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GLOBAL BERRY', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Global Berry S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GLOBAL BERRY')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GLOBAL BERRY') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Global Berry S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'IDEAL FRUITS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Ideal Fruits, S.l.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('IDEAL FRUITS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('IDEAL FRUITS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Ideal Fruits, S.l.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'IDEAL FRUITS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Ideal Fruits, S.l.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('IDEAL FRUITS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('IDEAL FRUITS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Ideal Fruits, S.l.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'LA CALIFORNIA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LA CALIFORNIA TRADING ESPANA SL.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('LA CALIFORNIA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('LA CALIFORNIA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LA CALIFORNIA TRADING ESPANA SL.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'OLYMPIC', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Olympic Fruit B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('OLYMPIC')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('OLYMPIC') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Olympic Fruit B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'OLYMPIC FRUITS', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Olympic Fruit B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('OLYMPIC FRUITS')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('OLYMPIC FRUITS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Olympic Fruit B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'OLYMPIC', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Olympic Fruit B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('OLYMPIC')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('OLYMPIC') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Olympic Fruit B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'OLYMPIC FRUITS', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Olympic Fruit B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('OLYMPIC FRUITS')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('OLYMPIC FRUITS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Olympic Fruit B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'OLYMPIC FRUIT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Olympic Fruit B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('OLYMPIC FRUIT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('OLYMPIC FRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Olympic Fruit B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'OLYMPIC FRUIT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Olympic Fruit B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('OLYMPIC FRUIT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('OLYMPIC FRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Olympic Fruit B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'SMART', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Smart Fruits S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('SMART')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('SMART') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Smart Fruits S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EUROGROUP ESPANA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EUROGROUP ESPANA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EUROGROUP ESPANA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'ESCOBAR', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Escobar Reyes, S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('ESCOBAR')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('ESCOBAR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Escobar Reyes, S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'COMPAGRI', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'KOMPAGRI ESPANA SL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('COMPAGRI')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('COMPAGRI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KOMPAGRI ESPANA SL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'KOMPAGRI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KOMPAGRI ESPANA SL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('KOMPAGRI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('KOMPAGRI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KOMPAGRI ESPANA SL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'MALENO Y TORRES', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Maleno Y Torres Exportación S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('MALENO Y TORRES')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('MALENO Y TORRES') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Maleno Y Torres Exportación S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'MALENO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Maleno Y Torres Exportación S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('MALENO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('MALENO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Maleno Y Torres Exportación S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'AGESCO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'AGESCO S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('AGESCO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('AGESCO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'AGESCO S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'AGESCO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'AGESCO S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('AGESCO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('AGESCO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'AGESCO S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'ECOINVER BIO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Ecoinver Bio S.L'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('ECOINVER BIO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('ECOINVER BIO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Ecoinver Bio S.L');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'ESMAR', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Esmar Frutas Imp-Exp. SL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('ESMAR')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('ESMAR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Esmar Frutas Imp-Exp. SL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'FAUS DURA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Faus Dura S.A.S.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('FAUS DURA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('FAUS DURA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Faus Dura S.A.S.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'FRUCTUS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Fructus Trade'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('FRUCTUS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('FRUCTUS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Fructus Trade');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'FRUBALMED', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRUBALMED SLU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('FRUBALMED')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('FRUBALMED') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRUBALMED SLU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'FRUBALMED', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRUBALMED SLU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('FRUBALMED')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('FRUBALMED') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRUBALMED SLU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'FRUBALMED', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRUBALMED SLU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('FRUBALMED')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('FRUBALMED') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRUBALMED SLU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'BOGNÁR', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Bognár Transport Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('BOGNÁR')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('BOGNÁR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Bognár Transport Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'BILEK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'BILEK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('BILEK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('BILEK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'BILEK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'BILEK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'BILEK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('BILEK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('BILEK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'BILEK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'BILEK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'BILEK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('BILEK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('BILEK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'BILEK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'BILEK LEVI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'BILEK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('BILEK LEVI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('BILEK LEVI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'BILEK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GREENYARD', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Greenyard Fresh Spain SA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GREENYARD')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GREENYARD') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Greenyard Fresh Spain SA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'GREENYARD', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Greenyard Fresh Spain SA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('GREENYARD')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('GREENYARD') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Greenyard Fresh Spain SA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'BUGYI FERENC', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Bugyi Ferenc Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('BUGYI FERENC')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('BUGYI FERENC') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Bugyi Ferenc Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GYÜMÖLCSÉRT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Gyümölcsért Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GYÜMÖLCSÉRT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GYÜMÖLCSÉRT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Gyümölcsért Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'GYÜMÖLCSÉRT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Gyümölcsért Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('GYÜMÖLCSÉRT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('GYÜMÖLCSÉRT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Gyümölcsért Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'HISPA GROUP', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Hispa Group Spain, S.L'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('HISPA GROUP')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('HISPA GROUP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Hispa Group Spain, S.L');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'HOFER', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'HOFER Trgovina d.o.o.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('HOFER')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('HOFER') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HOFER Trgovina d.o.o.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'BÉKA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'BÉKA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('BÉKA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('BÉKA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'BÉKA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'INDASOL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'INDASOL S.A.T.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('INDASOL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('INDASOL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'INDASOL S.A.T.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CROSS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CROSS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CROSS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CROSS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CROSS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'KOPALMERIA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KOPALMERIA S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('KOPALMERIA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('KOPALMERIA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KOPALMERIA S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KÓNYA', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Kónya Trans Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KÓNYA')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KÓNYA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Kónya Trans Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'KÓNYA', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Kónya Trans Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('KÓNYA')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('KÓNYA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Kónya Trans Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'KÓNYA', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Kónya Trans Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('KÓNYA')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('KÓNYA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Kónya Trans Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CSÍK ZOLTÁN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CSÍK ZOLTÁN'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CSÍK ZOLTÁN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CSÍK ZOLTÁN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CSÍK ZOLTÁN');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'LA PIRUJITA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'La Pirujita SCA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('LA PIRUJITA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('LA PIRUJITA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'La Pirujita SCA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'LEHMANN', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'LEHMANN & TROOST B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('LEHMANN')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('LEHMANN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LEHMANN & TROOST B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'LEHMANN', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'LEHMANN & TROOST B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('LEHMANN')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('LEHMANN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LEHMANN & TROOST B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'LEHMANN & TROOST', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LEHMANN & TROOST B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('LEHMANN & TROOST')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('LEHMANN & TROOST') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LEHMANN & TROOST B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'LEHMANN & TROOST', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LEHMANN & TROOST B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('LEHMANN & TROOST')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('LEHMANN & TROOST') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LEHMANN & TROOST B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'MANEKI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Maneki Neko Group s.r.o.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('MANEKI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('MANEKI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Maneki Neko Group s.r.o.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'Csávó', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Csávó'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('Csávó')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('Csávó') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Csávó');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KRISTÓF PÉTER', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KRISTÓF PÉTER'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KRISTÓF PÉTER')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KRISTÓF PÉTER') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KRISTÓF PÉTER');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'MÜLLER', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Müller-Transporte Gesellschaft m.b.H.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('MÜLLER')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('MÜLLER') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Müller-Transporte Gesellschaft m.b.H.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'NATURNAR', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'NATURNAR KRYLUAN SL.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('NATURNAR')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('NATURNAR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'NATURNAR KRYLUAN SL.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'NATURINDA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'NATURINDA, SLNE'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('NATURINDA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('NATURINDA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'NATURINDA, SLNE');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KRISZTIÁN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KRISZTIÁN'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KRISZTIÁN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KRISZTIÁN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KRISZTIÁN');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KUONI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KUONI TRADE KFT.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KUONI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KUONI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KUONI TRADE KFT.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ORANGE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Orange Factory Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ORANGE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ORANGE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Orange Factory Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'PAP JÓZSEFNÉ', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Pap Józsefné'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('PAP JÓZSEFNÉ')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('PAP JÓZSEFNÉ') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Pap Józsefné');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KV LOG', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KV LOG'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KV LOG')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KV LOG') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KV LOG');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'VERMIO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VERMIO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('VERMIO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('VERMIO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VERMIO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'VERMIO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VERMIO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('VERMIO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('VERMIO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VERMIO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'VERMION', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VERMION'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('VERMION')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('VERMION') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VERMION');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'VERMION', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VERMION'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('VERMION')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('VERMION') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VERMION');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'RELAX FRUITS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Relax Fruits And Vegetables S.L'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('RELAX FRUITS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('RELAX FRUITS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Relax Fruits And Vegetables S.L');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SAN NICOLA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SAN NICOLA GROUP S.R.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SAN NICOLA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SAN NICOLA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SAN NICOLA GROUP S.R.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'SAN NICOLA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SAN NICOLA GROUP S.R.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('SAN NICOLA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('SAN NICOLA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SAN NICOLA GROUP S.R.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'SAN NICOLA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SAN NICOLA GROUP S.R.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('SAN NICOLA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('SAN NICOLA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SAN NICOLA GROUP S.R.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'SENOR TOMATE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Senor Tomate Kereskedelmi Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('SENOR TOMATE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('SENOR TOMATE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Senor Tomate Kereskedelmi Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'SOLHERBS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SOLHERBS, S.L.U.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('SOLHERBS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('SOLHERBS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SOLHERBS, S.L.U.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SOÓS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Soós Mihályné'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SOÓS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SOÓS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Soós Mihályné');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'SYLVAN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Sylvan Hungária Zrt.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('SYLVAN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('SYLVAN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Sylvan Hungária Zrt.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'SYLVAN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Sylvan Hungária Zrt.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('SYLVAN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('SYLVAN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Sylvan Hungária Zrt.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'THERMO', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Thermonet Trade Kereskedelmi Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('THERMO')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('THERMO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Thermonet Trade Kereskedelmi Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'THERMO FRUCHT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'THERMO FRUCHT Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('THERMO FRUCHT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('THERMO FRUCHT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'THERMO FRUCHT Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'TOLEDANO HORTICOLA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Toledano Horticola S.L'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('TOLEDANO HORTICOLA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('TOLEDANO HORTICOLA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Toledano Horticola S.L');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'VICASOL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Vicasol S. Coop. And.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('VICASOL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('VICASOL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Vicasol S. Coop. And.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'VIRÁG', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Virág Sándor'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('VIRÁG')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('VIRÁG') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Virág Sándor');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'THERMO', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Thermo Épitöipari Tervezö Szervezö És Kivitelezö Kft'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('THERMO')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('THERMO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Thermo Épitöipari Tervezö Szervezö És Kivitelezö Kft');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'PANNON', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Pannon Fruit Cargo Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('PANNON')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('PANNON') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Pannon Fruit Cargo Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'PANNONFRUIT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'PANNONFRUIT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('PANNONFRUIT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('PANNONFRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'PANNONFRUIT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'PAP', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'PAP'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('PAP')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('PAP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'PAP');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'PET-IMPEX', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'PET-IMPEX'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('PET-IMPEX')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('PET-IMPEX') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'PET-IMPEX');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'POLAND', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'POLAND'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('POLAND')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('POLAND') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'POLAND');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'POLSKA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'POLSKA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('POLSKA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('POLSKA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'POLSKA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ALL FRESH', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'All Fresh Logistics GmbH'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ALL FRESH')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ALL FRESH') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'All Fresh Logistics GmbH');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ANTIGONE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ANTIGONE'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ANTIGONE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ANTIGONE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ANTIGONE');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ATRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ATRANS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ATRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ATRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ATRANS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'BVT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'BVT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('BVT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('BVT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'BVT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CALICHE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CALICHE'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CALICHE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CALICHE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CALICHE');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CHAMPION', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CHAMPION'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CHAMPION')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CHAMPION') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CHAMPION');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CHER', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CHER'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CHER')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CHER') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CHER');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CSACSI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CSACSI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CSACSI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CSACSI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CSACSI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'CSÍK ZOLI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'CSÍK ZOLI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('CSÍK ZOLI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('CSÍK ZOLI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'CSÍK ZOLI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'Citrom 10kg', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Citrom 10kg'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('Citrom 10kg')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('Citrom 10kg') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Citrom 10kg');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'FARAON', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FARAON EGIPCIO SL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('FARAON')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('FARAON') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FARAON EGIPCIO SL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'FARAON', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FARAON EGIPCIO SL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('FARAON')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('FARAON') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FARAON EGIPCIO SL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'DIANIA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'DIANIA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('DIANIA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('DIANIA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DIANIA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'DINAMO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'DINAMO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('DINAMO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('DINAMO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DINAMO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'DINAMÓ', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'DINAMÓ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('DINAMÓ')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('DINAMÓ') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DINAMÓ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'DRAGAN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'DRAGAN'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('DRAGAN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('DRAGAN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DRAGAN');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'DÉLBALATON TÉSZ', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'DÉLBALATON TÉSZ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('DÉLBALATON TÉSZ')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('DÉLBALATON TÉSZ') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DÉLBALATON TÉSZ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'Dóri', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Dóri'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('Dóri')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('Dóri') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Dóri');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ESKADA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ESKADA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ESKADA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ESKADA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ESKADA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'EURO MILAN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'EURO MILAN'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('EURO MILAN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('EURO MILAN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'EURO MILAN');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'FER TRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Fer Trans ''96 Szállítási Szolgáltató Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('FER TRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('FER TRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Fer Trans ''96 Szállítási Szolgáltató Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'FRESCO TRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Fresco Trans'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('FRESCO TRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('FRESCO TRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Fresco Trans');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'FRIGOSPED', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRIGOSPED'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('FRIGOSPED')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('FRIGOSPED') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRIGOSPED');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'FRIGOSPED SK', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'FRIGOSPED SK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('FRIGOSPED SK')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('FRIGOSPED SK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FRIGOSPED SK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'FUSTER', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'FUSTER'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('FUSTER')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('FUSTER') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'FUSTER');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'G ROAD', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'G ROAD'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('G ROAD')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('G ROAD') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'G ROAD');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'G-ROAD', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'G-ROAD Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('G-ROAD')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('G-ROAD') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'G-ROAD Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'GARTNER', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GARTNER'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('GARTNER')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('GARTNER') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GARTNER');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HANK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'HANK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HANK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HANK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HANK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HANKÓ', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'HANKÓ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HANKÓ')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HANKÓ') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HANKÓ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HILTOP', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Hilltop Logisztikai Kft'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HILTOP')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HILTOP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Hilltop Logisztikai Kft');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HILLTOP', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Hilltop Logisztikai Kft'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HILLTOP')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HILLTOP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Hilltop Logisztikai Kft');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HRT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'HRT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HRT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HRT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HRT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HZ', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'HZ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HZ')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HZ') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HZ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HZ LOG', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'HZ LOG'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HZ LOG')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HZ LOG') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HZ LOG');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'HZ LOGISTICS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'HZ LOGISTICS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('HZ LOGISTICS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('HZ LOGISTICS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'HZ LOGISTICS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'IMANOV', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'IMANOV'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('IMANOV')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('IMANOV') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'IMANOV');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'IMANOV / KÓNYA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'IMANOV / KÓNYA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('IMANOV / KÓNYA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('IMANOV / KÓNYA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'IMANOV / KÓNYA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'INTERTRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'INTERTRANS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('INTERTRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('INTERTRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'INTERTRANS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'JOKER', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'JOKER'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('JOKER')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('JOKER') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'JOKER');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'JUICE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'JUICE'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('JUICE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('JUICE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'JUICE');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'KARKAVITSAS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KARKAVITSAS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('KARKAVITSAS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('KARKAVITSAS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KARKAVITSAS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KARKAVITSAS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KARKAVITSAS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KARKAVITSAS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KARKAVITSAS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KARKAVITSAS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KESSEC', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KESSEC'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KESSEC')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KESSEC') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KESSEC');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KI-JU-TÓ', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Ki-Ju-Tó Szolgáltató És Kereskedelmi Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KI-JU-TÓ')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KI-JU-TÓ') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Ki-Ju-Tó Szolgáltató És Kereskedelmi Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KIJUTÓ', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KIJUTÓ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KIJUTÓ')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KIJUTÓ') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KIJUTÓ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KOZAK', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KOZAK'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KOZAK')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KOZAK') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KOZAK');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'AGROSTAR', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'AGROSTAR VEGETABLES KFT.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('AGROSTAR')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('AGROSTAR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'AGROSTAR VEGETABLES KFT.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ARVEN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ARVEN PAZARLAMA LTD.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ARVEN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ARVEN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ARVEN PAZARLAMA LTD.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GAVA POLSKA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Gava Polska Sp. z o.o.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GAVA POLSKA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GAVA POLSKA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Gava Polska Sp. z o.o.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'GAVA POLSKA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Gava Polska Sp. z o.o.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('GAVA POLSKA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('GAVA POLSKA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Gava Polska Sp. z o.o.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'GRUPO NATURAL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GRUPO NATURAL DE EXPORTACIÓN Y PROD.DECITRICOS Y FRUTAS S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('GRUPO NATURAL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('GRUPO NATURAL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GRUPO NATURAL DE EXPORTACIÓN Y PROD.DECITRICOS Y FRUTAS S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'GRUPO NATURAL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'GRUPO NATURAL DE EXPORTACIÓN Y PROD.DECITRICOS Y FRUTAS S.L.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('GRUPO NATURAL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('GRUPO NATURAL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'GRUPO NATURAL DE EXPORTACIÓN Y PROD.DECITRICOS Y FRUTAS S.L.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KÁDÁR', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Kádár Trans Sped Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KÁDÁR')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KÁDÁR') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Kádár Trans Sped Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'LIVIU', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LIVIU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('LIVIU')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('LIVIU') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LIVIU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'LIVIU', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LIVIU'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('LIVIU')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('LIVIU') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LIVIU');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'LOGISTICHOME', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LOGISTICHOME'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('LOGISTICHOME')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('LOGISTICHOME') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LOGISTICHOME');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'LOGISTICSHOME', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LOGISTICSHOME'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('LOGISTICSHOME')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('LOGISTICSHOME') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LOGISTICSHOME');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'LUI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'LUI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('LUI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('LUI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'LUI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'MASEVERDE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'MASEVERDE'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('MASEVERDE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('MASEVERDE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'MASEVERDE');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'MESAVERDE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'MESAVERDE KFT.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('MESAVERDE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('MESAVERDE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'MESAVERDE KFT.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'MANDRESLOOT', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Mandersloot Expeditiebedrijf B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('MANDRESLOOT')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('MANDRESLOOT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Mandersloot Expeditiebedrijf B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'MANDERSLOOT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Mandersloot Expeditiebedrijf B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('MANDERSLOOT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('MANDERSLOOT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Mandersloot Expeditiebedrijf B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'MANDERSLOOT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Mandersloot Expeditiebedrijf B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('MANDERSLOOT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('MANDERSLOOT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Mandersloot Expeditiebedrijf B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'MANDERSLOOT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Mandersloot Expeditiebedrijf B.V.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('MANDERSLOOT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('MANDERSLOOT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Mandersloot Expeditiebedrijf B.V.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'NAGEL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'NAGEL HUNGÁRIA KFT.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('NAGEL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('NAGEL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'NAGEL HUNGÁRIA KFT.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'NH CARGO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'NH Cargo Kft'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('NH CARGO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('NH CARGO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'NH Cargo Kft');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'NÁPOLYI ZOLI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'NÁPOLYI ZOLI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('NÁPOLYI ZOLI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('NÁPOLYI ZOLI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'NÁPOLYI ZOLI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'P TRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'P TRANS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('P TRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('P TRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'P TRANS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'PÉCSI A./GIRTEKA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'PÉCSI A./GIRTEKA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('PÉCSI A./GIRTEKA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('PÉCSI A./GIRTEKA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'PÉCSI A./GIRTEKA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'RAINBOW', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'RAINBOW'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('RAINBOW')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('RAINBOW') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'RAINBOW');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'REMONA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'REMONA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('REMONA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('REMONA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'REMONA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'RENACRIS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'RENACRIS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('RENACRIS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('RENACRIS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'RENACRIS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ROSE TRADE', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ROSE TRADE'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ROSE TRADE')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ROSE TRADE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ROSE TRADE');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'S TRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'S TRANS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('S TRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('S TRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'S TRANS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'S TRANSPORT', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'S TRANSPORT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('S TRANSPORT')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('S TRANSPORT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'S TRANSPORT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'S-TRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'S-TRANS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('S-TRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('S-TRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'S-TRANS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'S-TRANSPORT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'S-Transport'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('S-TRANSPORT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('S-TRANSPORT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'S-Transport');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'S.T.I', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'S.T.I'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('S.T.I')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('S.T.I') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'S.T.I');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'S.T.I.', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'S.T.I. Hungary  Szállítmányozási Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('S.T.I.')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('S.T.I.') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'S.T.I. Hungary  Szállítmányozási Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SARTO KFT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SARTO KFT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SARTO KFT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SARTO KFT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SARTO KFT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SCANTRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Scantrans Kanizsa Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SCANTRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SCANTRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Scantrans Kanizsa Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SEED', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Seed Trans Korlátolt Felelősségű Társaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SEED')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SEED') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Seed Trans Korlátolt Felelősségű Társaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SERGIO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SERGIO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SERGIO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SERGIO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SERGIO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SHEBA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SHEBA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SHEBA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SHEBA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SHEBA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'SHEBA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SHEBA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('SHEBA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('SHEBA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SHEBA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SOÓS TRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SOÓS TRANS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SOÓS TRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SOÓS TRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SOÓS TRANS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'STI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'STI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('STI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('STI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'STI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'STÉ. ANATYS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'STÉ. ANATYS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('STÉ. ANATYS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('STÉ. ANATYS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'STÉ. ANATYS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SWISS TEMP', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Swiss Temp Logistics GmbH'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SWISS TEMP')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SWISS TEMP') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Swiss Temp Logistics GmbH');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SWISS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Swiss Temp Logistics GmbH'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SWISS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SWISS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Swiss Temp Logistics GmbH');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SZABÓ FERI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SZABÓ FERI'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SZABÓ FERI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SZABÓ FERI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SZABÓ FERI');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SZABÓ KATA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SZABÓ KATA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SZABÓ KATA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SZABÓ KATA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SZABÓ KATA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SZENTI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'SZENTI TRANS KFT.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SZENTI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SZENTI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'SZENTI TRANS KFT.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'SZÉKESI', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Székesi Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('SZÉKESI')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('SZÉKESI') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Székesi Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TARRAGONA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'TARRAGONA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TARRAGONA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TARRAGONA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'TARRAGONA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'THERMO FRUCHT KFT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'THERMO FRUCHT KFT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('THERMO FRUCHT KFT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('THERMO FRUCHT KFT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'THERMO FRUCHT KFT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TOMATO AL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'TOMATO AL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TOMATO AL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TOMATO AL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'TOMATO AL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TOOMATO-AL', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'TOOMATO-AL'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TOOMATO-AL')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TOOMATO-AL') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'TOOMATO-AL');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TRANS FLORA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'TRANS FLORA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TRANS FLORA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TRANS FLORA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'TRANS FLORA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TRANS SPED', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'TRANS SPED'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TRANS SPED')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TRANS SPED') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'TRANS SPED');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TRANS-SPED', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Trans-Sped Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TRANS-SPED')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TRANS-SPED') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Trans-Sped Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TWINS TRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'TWINS TRANS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TWINS TRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TWINS TRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'TWINS TRANS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'TÓTH FRIGO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'TÓTH FRIGO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('TÓTH FRIGO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('TÓTH FRIGO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'TÓTH FRIGO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'UZ TRANS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'UZ TRANS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('UZ TRANS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('UZ TRANS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'UZ TRANS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'V & B CARGO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'V & B CARGO'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('V & B CARGO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('V & B CARGO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'V & B CARGO');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'VASKÓ', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VASKÓ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('VASKÓ')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('VASKÓ') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VASKÓ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'KÓNYA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KÓNYA ZOLTÁNNÉ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('KÓNYA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('KÓNYA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KÓNYA ZOLTÁNNÉ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'KÓNYA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KÓNYA ZOLTÁNNÉ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('KÓNYA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('KÓNYA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KÓNYA ZOLTÁNNÉ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'KÓNYA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'KÓNYA ZOLTÁNNÉ'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('KÓNYA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('KÓNYA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'KÓNYA ZOLTÁNNÉ');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'VITA FRUIT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Vita Fruit SP. Z.O.O.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('VITA FRUIT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('VITA FRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Vita Fruit SP. Z.O.O.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'VITAFRUIT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VITAFRUIT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('VITAFRUIT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('VITAFRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VITAFRUIT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'VITAFRUIT', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'VITAFRUIT'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('VITAFRUIT')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('VITAFRUIT') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'VITAFRUIT');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'WABERER''S', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Waberer''s International Nyilvánosan Működő Részvénytársaság'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('WABERER''S')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('WABERER''S') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Waberer''s International Nyilvánosan Működő Részvénytársaság');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'WABERERS', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'WABERERS'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('WABERERS')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('WABERERS') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'WABERERS');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'WINDBAHN', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'WINDBAHN KFT.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('WINDBAHN')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('WINDBAHN') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'WINDBAHN KFT.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'XENIA', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'XENIA'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('XENIA')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('XENIA') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'XENIA');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ZAJAC', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ZAJAC'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ZAJAC')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ZAJAC') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ZAJAC');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'ZERO', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'ZERO TRADE Kft.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('ZERO')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('ZERO') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'ZERO TRADE Kft.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'VERMION FRESH', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Vermion Fresh S.A.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('VERMION FRESH')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('VERMION FRESH') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Vermion Fresh S.A.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, 'Fuvarozók', 'DERBY', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'DERBY FRUIT TRADE KFT.'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = 'Fuvarozók' 
  AND UPPER(value) = UPPER('DERBY')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = 'Fuvarozók' AND UPPER(value) = UPPER('DERBY') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'DERBY FRUIT TRADE KFT.');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'EUROGROUP DE', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Eurogroup Deutschland Gmbh'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('EUROGROUP DE')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('EUROGROUP DE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Eurogroup Deutschland Gmbh');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EUROGROUP DE', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Eurogroup Deutschland Gmbh'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EUROGROUP DE')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EUROGROUP DE') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Eurogroup Deutschland Gmbh');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EURORGOUP DEUTSCHLAND', true, false, '', NOW(), NOW()
FROM partners WHERE name = 'Eurogroup Deutschland Gmbh'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EURORGOUP DEUTSCHLAND')
);
UPDATE partner_identifiers SET is_inactive = true
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EURORGOUP DEUTSCHLAND') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Eurogroup Deutschland Gmbh');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Reference) Szállítók', 'EUROGROUP DEUTSCHLAND', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Eurogroup Deutschland Gmbh'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Reference) Szállítók' 
  AND UPPER(value) = UPPER('EUROGROUP DEUTSCHLAND')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Reference) Szállítók' AND UPPER(value) = UPPER('EUROGROUP DEUTSCHLAND') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Eurogroup Deutschland Gmbh');

INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)
SELECT id, '(Customer) Vevők', 'EUROGROUP DEUTSCHLAND', false, false, '', NOW(), NOW()
FROM partners WHERE name = 'Eurogroup Deutschland Gmbh'
AND NOT EXISTS (
  SELECT 1 FROM partner_identifiers 
  WHERE partner_id = partners.id 
  AND id_type = '(Customer) Vevők' 
  AND UPPER(value) = UPPER('EUROGROUP DEUTSCHLAND')
);
UPDATE partner_identifiers SET is_inactive = false
WHERE id_type = '(Customer) Vevők' AND UPPER(value) = UPPER('EUROGROUP DEUTSCHLAND') 
AND partner_id IN (SELECT id FROM partners WHERE name = 'Eurogroup Deutschland Gmbh');

