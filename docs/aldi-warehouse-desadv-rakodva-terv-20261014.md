# Warehouse DESADV (ASN) a Rakodva állapothoz kapcsolva

Dátum: 2026-10-14. Az alábbi eredeti terv alapján az LPN and Item Level ASN-előállítás, Rakodva-kapcsolat és SFTP küldési sor elkészült, belső tesztje sikeres. Aktuális állapot és adathiányok: [megvalósítási és adatellenőrzési jelentés](aldi-asn-megvalositas-es-adatellenorzes-20261014.md). A partneri profil/teszt és éles aktiválás még hátravan.

## Üzleti cél és dokumentált időzítés

A Warehouse DESADV az ALDI raktárának küldött ASN. Az ALDI EDI Guideline 1.4, 11. fejezete szerint tényleges kamionra rakodás után kell küldeni; az érvényes ASN szükséges az áruátvételhez. Egy PO több ASN-ben is teljesíthető, több PO szerepelhet egy ASN-ben. Meglévő ASN módosítását nem fogadják el, korrekcióhoz új ASN szükséges. A partner által elvárt LPN and Item Level vagy Variant Level MIG még megerősítendő.

Forrás: [ALDI EDI Guideline 1.4, 11. fejezet](<../ALDI opentext/Aldi Opentext dokumentumok/ALDI SOUTH Group - EDI Guideline for Suppliers_EANCOM.pdf>).

## Meglévő kód ellenőrzése

A frontend `Access UI/src/modules/aldi_rakodas.js` a kamion `is_loaded` állapotát menti a `/api/v1/aldi-cross-docking/trucks/:id` PUT végponttal. A „Rakodva” jelölés tehát kamionszintű. A felület megerősítéssel 100% alatti előkészítettségnél is engedi a jelölést; ezért a jelölés önmagában nem igazolja az ASN-adatok teljességét.

A backend `server/src/routes/aldi_cross_docking.js` tranzakcióban zárolja és módosítja a kamiont. A false → true átmenet a komissiózási sorok alapján növeli a kapcsolódó rendelés teljesített kartonszámát és eltávolítja a kapcsolódó lokációrekordokat. Kamion-, rendelés-, komissiózási- és SSCC-címke adatszerkezetek már rendelkezésre állnak. Ezek tartalmi teljességét, egyértelmű rendeléstétel-hivatkozását, valóban felrakodott mennyiségét és az összes tényleges raklaphoz tartozó SSCC-jét még vizsgálni kell. A jelenlegi megjelenítési API által soronként kiválasztott legutóbbi címke nem tekinthető automatikusan a teljes szállítmány raklaplistájának.

## Javasolt megvalósítás

1. A szerver a kamion első, sikeresen mentett false → true „Rakodva” átmenetéből indítja a szállítmányadatok rögzítését. Böngészőfrissítés, változatlan true mentése vagy más kamionadat módosítása nem hoz létre új ASN-t.
2. A ténylegesen felrakodott termékek/mennyiségek, rendelési számok és eredeti EDI tételhivatkozások, célraktár, időpontok, raklapszerkezet és SSCC-k alapján teljes szállítmányállapot készül. Több célraktár esetén a profil szerinti kézbesítési bontás szükséges; az ASN-eket a megfelelő címzetthez kell kapcsolni.
3. A kötelező adatok ellenőrzése és a MIG szerinti DESADV létrehozása külön állapotot kap. Hiányzó/homályos adatoknál nem küldünk találgatott tartalmat; a hiba javítható, látható marad. A fizikai rakodottság és az EDI-küldés státusza külön fogalom.
4. A szállítmány és a küldési feladat tartósan rögzül. A küldés háttérfolyamatban történik, átmeneti hálózati hibánál ismételhető. Az egyszer elkészült üzenet és ASN-azonosító az átviteli újrapróbáláskor megmarad; a partner duplikátumkezelését és visszaigazolásait egyeztetni kell. Tartalmi korrekció külön, ALDI-val egyeztetett új ASN-folyamat.
5. Az ERP-ben külön állapotok jelennek meg: ASN előkészítés/ellenőrzés, küldésre vár, elküldve, partneri befogadás vagy hiba. A technikai továbbítás nem azonos az ALDI üzleti elfogadásával.
6. Eredeti EDI, felrakodott állapot, események és partneri visszajelzések archiválódnak. Az éles kimenő DESADV archiválása külön tervezendő; a jelenlegi ORDERS tesztarchívum nem kész kimenő napló.

A tervezett adatforrás a Gava GLN-je (5990696117005), a tényleges SSCC-k és a partner által jóváhagyott UNB/NAD/kapcsolati profil. A cégprefix 5999883976 megléte nem bizonyítja az összes aktuális címke megfelelőségét.

## Onboarding következmény

Az első ütem kérelembe üzletileg érdemes a Warehouse DESADV-t az ORDERS mellé felvenni. A Task 4A szövegében jelezzük a rakodás utáni tervezett ASN-generálást és azt, hogy a küldő még nem készült el. A típusonkénti Yes igazolt MIG szerinti képességet jelent; a tervezett kör bővítése nem pótolja a megvalósítást és ellenőrzést. A Dropship DESADV külön üzleti folyamat. RECADV/INVOIC későbbi ütemét és a későbbi bővítés eljárását ALDI/OpenText részéről jóvá kell hagyatni.

Mielőtt a fejlesztést késznek tekintjük, próba kell részrakománnyal, több PO-val/célraktárral, ismételt Rakodva-mentéssel, hiányzó raklapazonosítóval, továbbítási hibával és ismétléssel, valamint tartalmi korrekcióval. A végső partneri ellenőrzéshez valódi profil és tesztkapcsolat szükséges.
