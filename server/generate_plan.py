import json
import os

with open('../mapping_report.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

md = """# Partner Szerepkörök Hozzárendelése (Párosítási Terv)

A kérésednek megfelelően átvizsgáltam a **Customer partnerek.csv**, **Reference partnerek.csv** és **Transport Company partnerek.csv** fájlokat, és a bennük szereplő rövidített neveket összepárosítottam a központi `partners` táblában található partnerekkel.

## User Review Required
> [!IMPORTANT]
> Kérlek, nézd át az alábbi párosításokat. Ahol **Nincs találat**, ott a központi adatbázisban nem található a partner, vagy nagyon eltér a neve. Ahol **Több találat** van, ott kérlek jelezd, melyik ID a megfelelő.
> Ha a többség (amelyik OK) megfelelő számodra, a jóváhagyásod (Proceed) után elvégzem ezen egyértelmű partnerek kategóriák / szerepkörök (Customer, Reference, Transport Company) beállítását a `partner_identifiers` táblában.

## 🛒 Vevők (Customer)
| CSV Rövidített Név | Javasolt Partner (Adatbázis Név) | Pontosság |
|---|---|---|
"""

for item in report.get('customers', []):
    matches = item.get('matches', [])
    if not matches:
        md += f"| {item['short_name_from_csv']} | ❌ Nincs találat | - |\n"
    elif len(matches) == 1:
        m = matches[0]
        md += f"| {item['short_name_from_csv']} | {m['partner']} (ID: {m['partner_id']}) | ✅ OK |\n"
    else:
        m_str = "<br>".join([f"{m['partner']} (ID: {m['partner_id']})" for m in matches])
        md += f"| {item['short_name_from_csv']} | {m_str} | ⚠️ Több találat |\n"

md += """
## 🏢 Szállítók (Reference)
| CSV Rövidített Név | Javasolt Partner (Adatbázis Név) | Pontosság |
|---|---|---|
"""

for item in report.get('references', []):
    matches = item.get('matches', [])
    if not matches:
        md += f"| {item['short_name_from_csv']} | ❌ Nincs találat | - |\n"
    elif len(matches) == 1:
        m = matches[0]
        md += f"| {item['short_name_from_csv']} | {m['partner']} (ID: {m['partner_id']}) | ✅ OK |\n"
    else:
        m_str = "<br>".join([f"{m['partner']} (ID: {m['partner_id']})" for m in matches])
        md += f"| {item['short_name_from_csv']} | {m_str} | ⚠️ Több találat |\n"

md += """
## 🚚 Fuvarozók (Transport Company)
| CSV Rövidített Név | Javasolt Partner (Adatbázis Név) | Pontosság |
|---|---|---|
"""

for item in report.get('transporters', []):
    matches = item.get('matches', [])
    if not matches:
        md += f"| {item['short_name_from_csv']} | ❌ Nincs találat | - |\n"
    elif len(matches) == 1:
        m = matches[0]
        md += f"| {item['short_name_from_csv']} | {m['partner']} (ID: {m['partner_id']}) | ✅ OK |\n"
    else:
        m_str = "<br>".join([f"{m['partner']} (ID: {m['partner_id']})" for m in matches])
        md += f"| {item['short_name_from_csv']} | {m_str} | ⚠️ Több találat |\n"

md += """
## Tervezett Megvalósítás
Miután elfogadtad a tervet:
1. Végigmegyek a 3 listán.
2. Csak az egyértelműen (✅ OK) párosítható partnereknél regisztrálom be a `partner_identifiers` táblába a szerepkörhöz tartozó azonosítót a megfelelő `partner_id`-hez.
3. Kérlek kommentben jelezd a "Több találat" és "Nincs találat" soroknál, hogy melyik ID-t (vagy új partner felvitelét) szeretnéd.
"""

artifact_path = r"C:\Users\klara\.gemini\antigravity-ide\brain\179648f4-603f-4785-82de-8f5aed465edc\implementation_plan.md"
with open(artifact_path, "w", encoding="utf-8") as out:
    out.write(md)
    
print("Artifact generated.")
