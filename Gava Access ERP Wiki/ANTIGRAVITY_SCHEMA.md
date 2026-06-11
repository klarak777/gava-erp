# Antigravity LLM Wiki Schema

Ez a dokumentum határozza meg a személyes tudásbázis karbantartási szabályait és struktúráját az Antigravity (LLM) számára. Ezt a dokumentumot az LLM minden feldolgozás előtt (vagy kontextus elvesztése esetén) referenciaként használja.

## 1. Mappastruktúra
- `00_Meta/`: Rendszerfájlok, indexek, naplók és ez a séma.
- `01_Raw_Sources/`: Nyers forrásanyagok (cikkek, kódrészletek, leírások). Ezt **csak olvassuk**, SOHA nem módosítjuk. Ez az igazság forrása.
- `02_Wiki/`: Az LLM által generált, strukturált és karbantartott tudásanyag (szintézisek, entitás-oldalak, koncepciók).

## 2. Frontmatter (YAML) Szabályok
Minden újonnan létrehozott vagy frissített fájlnak a `02_Wiki/` mappában tartalmaznia kell a következő fejlécet:
---
title: "Dokumentum Címe"
aliases: []
tags: [wiki]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["[[Hivatkozott_Forras]]"]
---

## 3. Az "Ingest" (Feldolgozási) Folyamat
Amikor a felhasználó utasítást ad egy új forrás (pl. `01_Raw_Sources/` mappában lévő fájl) feldolgozására:
1. **Olvasás:** Elolvasom és elemzem a forrást.
2. **Kérdezés (opcionális):** Szükség esetén egyeztetek a felhasználóval a legfontosabb fókuszpontokról.
3. **Frissítés:** Meglévő wiki oldalak frissítése az új információkkal. Ellentmondások esetén azok feljegyzése.
4. **Létrehozás:** Új fogalom-oldalak (Entity/Concept) létrehozása a `02_Wiki/` mappában.
5. **Indexelés:** Az `00_Meta/index.md` frissítése az új vagy módosított oldalakkal.
6. **Naplózás:** Új bejegyzés hozzáadása a `00_Meta/log.md` végére a következő formátumban:
   `## [YYYY-MM-DD] ingest | Forrás címe`

## 4. Query (Keresés és Szintézis)
Kérdés esetén a wiki fájljait olvasom (és szükség esetén az index.md-t használom ugrópontként). A generált, értékes és új szintéziseket visszamentem új Wiki oldalként. A lekérdezéseket is naplózom: `## [YYYY-MM-DD] query | Kérdés röviden`

## 5. Különleges elvárások (Okosszerződés Projekt)
- Cél: A platform UI fejlesztésének, moduláris komponenseinek, és a "Szerződés-piactér" specifikációinak összefoglalása.
- Külön figyelmet fordítunk a "Feltétel Modulok" állapotaira és a frontend-backend (MCU server) kapcsolatra.