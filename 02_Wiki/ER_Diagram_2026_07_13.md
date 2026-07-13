# GAVA ERP - Adatbázis ER Diagram (2026-07-13)
A jelenlegi állapot szerinti főbb pénzügyi és kamion adatbázis kapcsolatok (Különös tekintettel a "per-es" fuvarok és a kiegészítő pénzügyi táblák működésére).

```mermaid
erDiagram
    %% Fő tábla
    SHIPMENTS {
        int id PK "Azonosító sorszám"
        string order_number "Fuvarszám (pl. 123/1)"
        string season "Szezon (pl. 25-26)"
        string goods_currency "Deviza (pl. HUF, EUR)"
        decimal exchange_rate "Árfolyam"
        date loading_date "Rakodás dátuma"
    }

    %% Kiegészítő / Pénzügyi táblák
    SHIPMENT_LINES {
        int id PK "Azonosító"
        int shipment_id FK "Kapcsolat a fő kamionhoz"
        int product_id FK
        int partner_id FK "Vevő/Beszállító"
        decimal kgs_finance "Nettó súly"
        decimal boxes "Dobozszám"
    }

    FINANCE_TRANSPORT_LINES {
        int id PK
        int shipment_id FK "Kapcsolat a fő kamionhoz"
        string ref_name "Referencia (pl. AGROPONIENTE) - 'per-es' azonosító"
        string partner_name "Szállító neve"
        decimal amount "Összeg"
        string currency_code "Deviza"
    }

    FINANCE_UNIT_COST_LINES {
        int id PK
        int shipment_id FK "Kapcsolat a fő kamionhoz"
        string ref_name "Referencia (pl. AGROPONIENTE) - 'per-es' azonosító"
        int product_id FK
        decimal netto_kgs "Nettó súly"
        decimal price_per_kg "Ár / kg"
        decimal trans_per_kg "Szállítás / kg"
    }

    %% Szótár táblák
    PRODUCTS {
        int id PK
        string name "Terméknév"
    }

    PARTNERS {
        int id PK
        string name "Partner neve"
    }

    CURRENCIES {
        int id PK
        string code "Devizakód (pl. EUR)"
    }

    %% Kapcsolatok
    SHIPMENTS ||--o{ SHIPMENT_LINES : "tartalmazza (Goods)"
    SHIPMENTS ||--o{ FINANCE_TRANSPORT_LINES : "tartalmazza (Transport & Other)"
    SHIPMENTS ||--o{ FINANCE_UNIT_COST_LINES : "tartalmazza (Unit Costs)"
    
    PRODUCTS ||--o{ SHIPMENT_LINES : "szerepel benne"
    PRODUCTS ||--o{ FINANCE_UNIT_COST_LINES : "szerepel benne"
    
    PARTNERS ||--o{ SHIPMENT_LINES : "partnerkapcsolat"
```

## Kapcsolatok magyarázata
A `SHIPMENTS` tábla (Kamionok) a fő elem, amely a szezonnal és fuvarszámmal együtt képzi a logikai egyediséget. Az adatbázisban a gépi `id` (PK) kapcsolja össze a táblákat.
A pénzügyi táblák (`FINANCE_TRANSPORT_LINES` és `FINANCE_UNIT_COST_LINES`) a `shipment_id` mellett tartalmaznak egy `ref_name` oszlopot is. Ennek segítségével a rendszer az egy kamionhoz tartozó, de több részre bontott (pl. "AGROPONIENTE" és "AGROPONIENTE NATURAL") pénzügyi elszámolásokat egyértelműen szét tudja választani a "per-es" fuvarok esetén.
