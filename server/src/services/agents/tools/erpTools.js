const db = require('../../../db/db');

// READ-ONLY ERP tool-rendszer az MI ügynökök számára.
// NINCS szabad SQL generálás – csak ezek a fix lekérdezések futtathatók.

const erpToolDefinitions = [
    {
        type: 'function',
        function: {
            name: 'list_seasons',
            description: 'A rendszerben lévő szezonok listája (kód, kezdő- és záródátum).',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_partners',
            description: 'Partner keresése név alapján (részleges egyezés). Maximum 20 találat.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Partner neve vagy nevének részlete.' }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_shipments',
            description: 'Fuvarok (kamionok) listázása, opcionálisan szezonra és pénzügyi státuszra szűrve.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    finance_status: { type: 'string', description: 'Pénzügyi státusz: "Open" vagy "Close".' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 25, max 50).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_shipment_finance',
            description: 'Egy fuvar teljes pénzügyi képe: fuvarfej, bevételi sorok, fuvaronkénti költségsorok és kg-os önköltség-felépítés.',
            parameters: {
                type: 'object',
                properties: {
                    shipment_id: { type: 'integer', description: 'A fuvar azonosítója (id).' },
                    order_number: { type: 'string', description: 'Fuvar rendszáma, pl. "GHU 240".' },
                    season_code: { type: 'string', description: 'Szezon kódja az order_number egyértelműsítéséhez, pl. "25-26".' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_season_finance_summary',
            description: 'Szezon pénzügyi aggregátuma: fuvarok száma, finance státusz bontás, bevétel- és fuarköltség-összegek devizánként.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' }
                },
                required: ['season_code']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_financial_turnover',
            description: 'Lekérdezi a pénzügyi forgalmat (nettó árbevétel, bruttó, kg, láda) egy adott időszakra, hónapokra vagy devizákra bontva. Használd ezt az eszközt, ha konkrét dátumok vagy hónapok (pl. március-április) forgalmát kell összehasonlítanod.',
            parameters: {
                type: 'object',
                properties: {
                    start_date: { type: 'string', description: 'Kezdő dátum YYYY-MM-DD' },
                    end_date: { type: 'string', description: 'Záró dátum YYYY-MM-DD' },
                    group_by: { type: 'string', enum: ['none', 'month', 'currency', 'month_currency', 'loading_place', 'month_loading_place'], description: 'Hogyan csoportosítsa az eredményt. Lehetőségek: none, month, currency, month_currency, loading_place, month_loading_place.' }
                },
                required: ['start_date', 'end_date']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_top_partners_by_turnover',
            description: 'A legnagyobb forgalmú partnerek rangsora nettó árbevétel szerint (shipment_lines alapján), opcionálisan szezonra vagy dátumintervallumra szűrve. Használd, ha a felhasználó a top vevőkre/partnerekre kíváncsi.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    start_date: { type: 'string', description: 'Kezdő dátum YYYY-MM-DD (rakodási dátum szerint).' },
                    end_date: { type: 'string', description: 'Záró dátum YYYY-MM-DD (rakodási dátum szerint).' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 10, max 25).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_monthly_turnover_trend',
            description: 'Havi forgalmi trend az elmúlt N hónapra: nettó és bruttó árbevétel, eladott mennyiség (kg) és fuvarok száma hónapokra bontva. Használd időbeli alakulás, trend, havi összehasonlítás kérdésekre.',
            parameters: {
                type: 'object',
                properties: {
                    months: { type: 'integer', description: 'Visszamenőleg hány hónapot vizsgáljon (alap 12, max 36).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_transport_cost_analysis',
            description: 'Fuvar- és egyéb költségsorok (alfuvar, útdíj stb.) elemzése partnerre, hónapra vagy devizára bontva. Használd alfuvarozói költség-, útdíj- vagy devizás költségelemzésre.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    group_by: { type: 'string', enum: ['partner', 'month', 'currency'], description: 'Csoportosítás: partner (alap), month (date_entry havi) vagy currency.' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_outstanding_payments',
            description: 'Nyitott pénzügyi tételek: kiállított, de még le nem zárt / nem kiegyenlített fuvarszámlák listája és összesítése (EUR és HUF). Használd tartozás-, nyitott számla- vagy fizetési határidő kérdésekre.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_product_turnover',
            description: 'Termékenkénti forgalom: összesített kg, láda és nettó árbevétel termékenként, nettó árbevétel szerint csökkenő sorrendben. Használd, ha a felhasználó termékszintű forgalomra vagy top termékekre kíváncsi.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 15, max 50).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_season_comparison',
            description: 'Szezonok összehasonlítása: fuvarok száma, nettó árbevétel, fuvar-költség és eladott mennyiség szezononként. Ha nem adsz meg szezonkódokat, az utolsó 3 szezont hasonlítja össze.',
            parameters: {
                type: 'object',
                properties: {
                    season_codes: { type: 'array', items: { type: 'string' }, description: 'Összehasonlítandó szezonkódok, pl. ["24-25", "25-26"].' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_unit_cost_overview',
            description: 'Termékenkénti önköltség-áttekintés: kg-os eladási ár, fuvarköltség/kg, teljes önköltség/kg (súlyozott átlag) és fedezet (margin)/kg. Használd jövedelmezőségi, önköltség- vagy árréselemzésre.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    product_limit: { type: 'integer', description: 'Találatok maximális száma (alap 15, max 50).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_partner_details',
            description: 'Egy partner teljes profilja: alapadatok, telephelyek, elérhetőségek, kapcsolattartók, azonosítók (adószám, NEBIH stb.), bankszámlák, hitelkeret-beállítások, kategóriák, korlátozások, kedvezmények és események.',
            parameters: {
                type: 'object',
                properties: {
                    partner_id: { type: 'integer', description: 'A partner azonosítója (id).' },
                    partner_name: { type: 'string', description: 'Partner neve vagy nevének részlete, ha nincs partner_id.' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_partner_history',
            description: 'Egy partner forgalmi és fuvar-története: szezononkénti nettó árbevétel, kg és fuvarszám, valamint a legutóbbi fuvarjai.',
            parameters: {
                type: 'object',
                properties: {
                    partner_id: { type: 'integer', description: 'A partner azonosítója (id).' },
                    partner_name: { type: 'string', description: 'Partner neve vagy nevének részlete, ha nincs partner_id.' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_partner_events',
            description: 'Partner-események listázása (dátum, típus, megnevezés), opcionálisan partnerre szűrve, legfrissebb elöl.',
            parameters: {
                type: 'object',
                properties: {
                    partner_id: { type: 'integer', description: 'A partner azonosítója (id).' },
                    partner_name: { type: 'string', description: 'Partner neve vagy nevének részlete.' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 25, max 100).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_unfulfilled_cargo_demands',
            description: 'Nyitott (még nem teljesített) áruigények listája, opcionálisan termékre vagy partnerre szűrve. Használd áruigény-, igénylés- vagy nyitott rendelés kérdésekre.',
            parameters: {
                type: 'object',
                properties: {
                    product_query: { type: 'string', description: 'Termék neve vagy nevének részlete.' },
                    partner_query: { type: 'string', description: 'Partner neve vagy nevének részlete.' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 50, max 100).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_loading_status',
            description: 'Rakodási események (loading_events) állapota a hozzájuk tartozó áruigény-összesítéssel (igényelt raklapok, elküldött tételek). Alapból a függő rakodásokat mutatja.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    include_loaded: { type: 'boolean', description: 'Ha igaz, a már lerakodott eseményeket is listázza (alap: csak a függőek).' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 25, max 50).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_unreceived_lines',
            description: 'Be nem érkezett fuvarsorok (is_received = false) listája vevővel, termékkel és raklapszámmal, opcionálisan rakodási dátum-intervallumra szűrve.',
            parameters: {
                type: 'object',
                properties: {
                    start_date: { type: 'string', description: 'Kezdő dátum YYYY-MM-DD (rakodási dátum szerint).' },
                    end_date: { type: 'string', description: 'Záró dátum YYYY-MM-DD (rakodási dátum szerint).' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 50, max 100).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_document_status',
            description: 'Fuvarmegbízások és EKAER-ek státusza: elküldött/nem elküldött darabszámok, GHU/LOG bontás, plusz a nem elküldött dokumentumok listája. Használd fuvarmegbízás- vagy EKAER-küldés kérdésekre.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    limit: { type: 'integer', description: 'A nem elküldött tételek maximális száma (alap 25, max 50).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_pallet_statistics',
            description: 'Raklapforgalmi statisztika (számított összesített raklapszám a v_shipment_costs nézetből) termékre, partnerre, lerakóhelyre vagy hónapra bontva.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    start_date: { type: 'string', description: 'Kezdő dátum YYYY-MM-DD (rakodási dátum szerint).' },
                    end_date: { type: 'string', description: 'Záró dátum YYYY-MM-DD (rakodási dátum szerint).' },
                    group_by: { type: 'string', enum: ['product', 'partner', 'destination', 'month'], description: 'Csoportosítás: product (alap), partner, destination vagy month.' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 15, max 50).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_transport_cost_lines',
            description: 'Fuvarköltség- és egyéb költségsorok (finance_transport_lines) részletes listája, szezonra, típusra (type_supp), partnerre vagy fuvar-rendszámra szűrve.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    type_supp: { type: 'string', description: 'Költségsor típusa (type_supp), pl. alfuvar, útdíj.' },
                    partner_query: { type: 'string', description: 'Partner neve vagy nevének részlete.' },
                    order_number: { type: 'string', description: 'Fuvar rendszáma, pl. "GHU 240".' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 50, max 100).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_vat_report',
            description: 'ÁFA-kimutatás: nettó, áfa és bruttó összegek áfakulcsra és hónapra bontva a bevételi sorokból. Használd számlázási / áfa-összesítő kérdésekre.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' },
                    start_date: { type: 'string', description: 'Kezdő dátum YYYY-MM-DD (rakodási dátum szerint).' },
                    end_date: { type: 'string', description: 'Záró dátum YYYY-MM-DD (rakodási dátum szerint).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_credit_limit_usage',
            description: 'Hitelkeret-kihasználtság: a hitelkerettel rendelkező partnerek kerete, késedelmi kamata, és a hozzájuk tartozó nyitott (Open státuszú) fuvarok sorainak bruttó értéke.',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 25, max 50).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_transporter_performance',
            description: 'Fuvarozónkénti teljesítmény: fuvarok száma, átlagos fuvarár, átlagos szállítási idő (nap) és fuvarár-összeg, opcionálisan szezonra szűrve.',
            parameters: {
                type: 'object',
                properties: {
                    season_code: { type: 'string', description: 'Szezon kódja, pl. "25-26".' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_products',
            description: 'Terméktörzs listázása (név, kategória, referencia, aktív státusz), opcionálisan névrészletre szűrve.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Termék neve vagy nevének részlete.' },
                    active_only: { type: 'boolean', description: 'Ha igaz, csak aktív termékek (alap: igaz).' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 50, max 100).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_transporters',
            description: 'Fuvarozótörzs listázása (név, kód, aktív státusz).',
            parameters: {
                type: 'object',
                properties: {
                    active_only: { type: 'boolean', description: 'Ha igaz, csak aktív fuvarozók (alap: igaz).' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_partner_identifiers',
            description: 'Partner keresése azonosító alapján (adószám, közösségi adószám, NEBIH szám stb.), értékre és/vagy azonosító-típusra szűrve.',
            parameters: {
                type: 'object',
                properties: {
                    value: { type: 'string', description: 'Az azonosító értéke vagy részlete, pl. adószám.' },
                    id_type: { type: 'string', description: 'Azonosító típusa (id_type), pl. "Adószám", "NEBIH".' },
                    limit: { type: 'integer', description: 'Találatok maximális száma (alap 25, max 50).' }
                },
                required: []
            }
        }
    }
];

async function listSeasons() {
    const rows = await db('seasons')
        .select('id', 'code', 'start_date', 'end_date')
        .orderBy('start_date', 'desc');
    return { seasons: rows };
}

async function searchPartners({ query }) {
    if (!query || !String(query).trim()) {
        return { partners: [], message: 'Üres keresőkifejezés.' };
    }
    const rows = await db('partners')
        .select('id', 'name', 'type', 'is_active')
        .whereILike('name', `%${String(query).trim()}%`)
        .orderBy('name')
        .limit(20);
    return { partners: rows, count: rows.length };
}

async function listShipments({ season_code, finance_status, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 25;
    if (lim > 50) lim = 50;

    const q = db('shipments as s')
        .join('seasons as se', 's.season_id', 'se.id')
        .select(
            's.id', 's.order_number', 's.truck_type', 's.loading_date',
            's.plate_number', 's.finance_status', 's.transport_price',
            's.transport_currency', 's.invoice_amount_eur', 'se.code as season_code'
        )
        .orderBy('s.loading_date', 'desc')
        .limit(lim);

    if (season_code) q.where('se.code', season_code);
    if (finance_status) q.where('s.finance_status', finance_status);

    const rows = await q;
    return { shipments: rows, count: rows.length };
}

async function getShipmentFinance({ shipment_id, order_number, season_code } = {}) {
    let shipment = null;
    if (shipment_id) {
        shipment = await db('shipments').where('id', shipment_id).first();
    } else if (order_number) {
        const q = db('shipments as s')
            .join('seasons as se', 's.season_id', 'se.id')
            .select('s.*', 'se.code as season_code')
            .where('s.order_number', order_number);
        if (season_code) q.where('se.code', season_code);
        shipment = await q.first();
        if (!shipment) {
            return { error: `Nem található fuvar a megadott azonosítóval (order_number: ${order_number}, season: ${season_code || 'bármely'}).` };
        }
    } else {
        return { error: 'Adj meg shipment_id-t vagy order_number-t.' };
    }
    if (!shipment) {
        return { error: `Nem található fuvar a megadott azonosítóval (id: ${shipment_id}).` };
    }

    const [revenueLines, transportLines, unitCostLines] = await Promise.all([
        db('shipment_lines as sl')
            .leftJoin('partners as p', 'sl.partner_id', 'p.id')
            .leftJoin('products as pr', 'sl.product_id', 'pr.id')
            .where('sl.shipment_id', shipment.id)
            .select(
                'sl.id', 'p.name as partner_name', 'pr.name as product_name',
                'sl.customer', 'sl.destination', 'sl.boxes', 'sl.kgs_finance',
                'sl.unit_price', 'sl.net_amount', 'sl.tax_percent', 'sl.tax_amount',
                'sl.amount_a', 'sl.description_finance'
            )
            .limit(100),
        db('finance_transport_lines as ftl')
            .leftJoin('partners as p', 'ftl.partner_id', 'p.id')
            .leftJoin('currencies as c', 'ftl.currency_id', 'c.id')
            .where('ftl.shipment_id', shipment.id)
            .select(
                'ftl.id', 'ftl.ref_name', 'ftl.type_supp', 'p.name as partner_name',
                'ftl.invoice_number', 'ftl.amount', 'ftl.tax_percent', 'ftl.tot_invoice',
                'c.code as currency', 'ftl.exchange_rate', 'ftl.total_inv_local',
                'ftl.season', 'ftl.truck_nr'
            )
            .orderBy('ftl.line_order')
            .limit(100),
        db('finance_unit_cost_lines as fuc')
            .leftJoin('products as pr', 'fuc.product_id', 'pr.id')
            .where('fuc.shipment_id', shipment.id)
            .select(
                'fuc.id', 'pr.name as product_name', 'fuc.description', 'fuc.netto_kgs',
                'fuc.price_per_kg', 'fuc.trans_per_kg', 'fuc.v_cost_per_kg',
                'fuc.oh_per_kg', 'fuc.tot_cost_per_kg', 'fuc.vat_per_kg'
            )
            .orderBy('fuc.line_order')
            .limit(100)
    ]);

    return { shipment, revenue_lines: revenueLines, transport_lines: transportLines, unit_cost_lines: unitCostLines };
}

async function getSeasonFinanceSummary({ season_code } = {}) {
    if (!season_code) {
        return { error: 'Adj meg season_code-ot (pl. "25-26").' };
    }
    const season = await db('seasons').where('code', season_code).first();
    if (!season) {
        return { error: `Nem található szezon a megadott kóddal: ${season_code}` };
    }

    // Fuvarok száma és finance státusz bontás
    const statusRows = await db('shipments')
        .where('season_id', season.id)
        .select('finance_status')
        .count('* as count')
        .groupBy('finance_status');

    const totalRow = await db('shipments')
        .where('season_id', season.id)
        .count('* as count')
        .first();

    // Bevétel-összegek a bevételi sorokból (net_amount / amount_a, goods_currency szerint)
    const revenueRows = await db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .where('s.season_id', season.id)
        .select('s.goods_currency as currency')
        .sum('sl.net_amount as net_amount_sum')
        .sum('sl.amount_a as amount_a_sum')
        .groupBy('s.goods_currency');

    // Fuvar-költségek devizánként (finance_transport_lines)
    const transportRows = await db('finance_transport_lines as ftl')
        .join('shipments as s', 'ftl.shipment_id', 's.id')
        .leftJoin('currencies as c', 'ftl.currency_id', 'c.id')
        .where('s.season_id', season.id)
        .select(db.raw("COALESCE(c.code, '?') as currency"))
        .sum('ftl.amount as amount_sum')
        .sum('ftl.tot_invoice as tot_invoice_sum')
        .groupBy('c.code');

    return {
        season: { code: season.code, start_date: season.start_date, end_date: season.end_date },
        shipment_count: parseInt(totalRow.count, 10),
        finance_status_breakdown: statusRows.map(r => ({ status: r.finance_status || 'nincs megadva', count: parseInt(r.count, 10) })),
        revenue_by_currency: revenueRows,
        transport_costs_by_currency: transportRows
    };
}

async function getFinancialTurnover({ start_date, end_date, group_by } = {}) {
    if (!start_date || !end_date) {
        return { error: 'Add meg a start_date és end_date paramétereket (YYYY-MM-DD).' };
    }

    const q = db('shipments as s')
        .join('shipment_lines as sl', 's.id', 'sl.shipment_id')
        .where('s.loading_date', '>=', start_date)
        .where('s.loading_date', '<=', end_date);

    let groupByFields = [];
    let selectFields = [
        db.raw('COUNT(DISTINCT s.id) as shipment_count'),
        db.raw('SUM(sl.net_amount) as total_net_amount'),
        db.raw('SUM(sl.tax_amount) as total_tax_amount'),
        db.raw('SUM(sl.amount_a) as total_gross_amount'),
        db.raw('SUM(sl.kgs_finance) as total_kgs'),
        db.raw('SUM(sl.boxes) as total_boxes')
    ];

    if (group_by === 'month' || group_by === 'month_currency') {
        groupByFields.push(db.raw("TO_CHAR(s.loading_date, 'YYYY-MM')"));
        selectFields.push(db.raw("TO_CHAR(s.loading_date, 'YYYY-MM') as month"));
    }
    
    if (group_by === 'currency' || group_by === 'month_currency') {
        groupByFields.push('s.goods_currency');
        selectFields.push('s.goods_currency as currency');
    }

    if (group_by === 'loading_place' || group_by === 'month_loading_place') {
        groupByFields.push('s.loading_place');
        selectFields.push('s.loading_place');
    }

    q.select(...selectFields);

    if (groupByFields.length > 0) {
        q.groupByRaw(groupByFields.join(', '));
        q.orderByRaw(groupByFields.join(', '));
    }

    const rows = await q;
    return { data: rows };
}

async function getTopPartnersByTurnover({ season_code, start_date, end_date, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 10;
    if (lim > 25) lim = 25;

    const q = db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .leftJoin('partners as p', 'sl.partner_id', 'p.id')
        .select(db.raw("COALESCE(p.id, 0) as partner_id"), db.raw("COALESCE(p.name, sl.customer, 'Ismeretlen partner') as partner_name"))
        .sum('sl.net_amount as total_net_amount')
        .sum('sl.kgs_finance as total_kgs')
        .countDistinct('s.id as shipment_count')
        .groupByRaw("COALESCE(p.id, 0), COALESCE(p.name, sl.customer, 'Ismeretlen partner')")
        .orderBy('total_net_amount', 'desc')
        .limit(lim);

    if (season_code) {
        q.join('seasons as se', 's.season_id', 'se.id').where('se.code', season_code);
    }
    if (start_date) q.where('s.loading_date', '>=', start_date);
    if (end_date) q.where('s.loading_date', '<=', end_date);

    const rows = await q;
    const partners = rows.map((r, i) => ({
        partner_id: r.partner_id,
        partner_name: r.partner_name,
        total_net_amount: parseFloat(r.total_net_amount) || 0,
        total_kgs: parseFloat(r.total_kgs) || 0,
        shipment_count: parseInt(r.shipment_count, 10),
        rank: i + 1
    }));
    return { partners, count: partners.length };
}

async function getMonthlyTurnoverTrend({ months } = {}) {
    let m = parseInt(months, 10);
    if (isNaN(m) || m <= 0) m = 12;
    if (m > 36) m = 36;

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - m);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const rows = await db('shipments as s')
        .join('shipment_lines as sl', 's.id', 'sl.shipment_id')
        .where('s.loading_date', '>=', cutoffStr)
        .select(db.raw("TO_CHAR(s.loading_date, 'YYYY-MM') as month"))
        .sum('sl.net_amount as total_net_amount')
        .sum('sl.amount_a as total_gross_amount')
        .sum('sl.kgs_finance as total_kgs')
        .countDistinct('s.id as shipment_count')
        .groupByRaw("TO_CHAR(s.loading_date, 'YYYY-MM')")
        .orderByRaw("TO_CHAR(s.loading_date, 'YYYY-MM') asc");

    return {
        months: m,
        trend: rows.map(r => ({
            month: r.month,
            total_net_amount: parseFloat(r.total_net_amount) || 0,
            total_gross_amount: parseFloat(r.total_gross_amount) || 0,
            total_kgs: parseFloat(r.total_kgs) || 0,
            shipment_count: parseInt(r.shipment_count, 10)
        }))
    };
}

async function getTransportCostAnalysis({ season_code, group_by } = {}) {
    const allowedGroupBy = ['partner', 'month', 'currency'];
    const gb = allowedGroupBy.includes(group_by) ? group_by : 'partner';

    const q = db('finance_transport_lines as ftl')
        .join('shipments as s', 'ftl.shipment_id', 's.id')
        .leftJoin('partners as p', 'ftl.partner_id', 'p.id')
        .leftJoin('currencies as c', 'ftl.currency_id', 'c.id')
        .sum('ftl.amount as total_amount')
        .sum('ftl.tax_amount as total_tax')
        .sum('ftl.tot_invoice as total_invoice')
        .count('ftl.id as line_count');

    if (season_code) {
        q.join('seasons as se', 's.season_id', 'se.id').where('se.code', season_code);
    }

    if (gb === 'partner') {
        q.select(db.raw("COALESCE(p.name, ftl.ref_name, 'Ismeretlen partner') as group_key"))
            .groupByRaw("COALESCE(p.name, ftl.ref_name, 'Ismeretlen partner')")
            .orderBy('total_amount', 'desc')
            .limit(25);
    } else if (gb === 'month') {
        q.select(db.raw("TO_CHAR(ftl.date_entry, 'YYYY-MM') as group_key"))
            .groupByRaw("TO_CHAR(ftl.date_entry, 'YYYY-MM')")
            .orderByRaw("TO_CHAR(ftl.date_entry, 'YYYY-MM') asc");
    } else {
        q.select(db.raw("COALESCE(c.code, '?') as group_key"))
            .groupByRaw("COALESCE(c.code, '?')")
            .orderBy('total_amount', 'desc');
    }

    const rows = await q;
    return {
        group_by: gb,
        groups: rows.map(r => ({
            group_key: r.group_key,
            total_amount: parseFloat(r.total_amount) || 0,
            total_tax: parseFloat(r.total_tax) || 0,
            total_invoice: parseFloat(r.total_invoice) || 0,
            line_count: parseInt(r.line_count, 10)
        }))
    };
}

async function getOutstandingPayments({ season_code } = {}) {
    const baseQ = () => {
        const q = db('shipments as s')
            .join('seasons as se', 's.season_id', 'se.id')
            .where(function () {
                this.where('s.finance_status', 'Open').orWhereNull('s.payment_date');
            })
            .where(function () {
                this.whereNotNull('s.invoice_number')
                    .orWhereNotNull('s.invoice_amount_eur')
                    .orWhereNotNull('s.invoice_amount_huf');
            });
        if (season_code) q.where('se.code', season_code);
        return q;
    };

    const rows = await baseQ()
        .select(
            's.id as shipment_id', 's.order_number', 'se.code as season_code',
            's.invoice_number', 's.invoice_amount_eur', 's.invoice_amount_huf',
            's.loading_date', 's.finance_status', 's.payment_date',
            db.raw("CURRENT_DATE - COALESCE(s.finance_date, s.loading_date) as days_outstanding")
        )
        .orderBy('s.loading_date', 'desc')
        .limit(100);

    const totals = await baseQ()
        .sum('s.invoice_amount_eur as total_open_eur')
        .sum('s.invoice_amount_huf as total_open_huf')
        .count('s.id as count')
        .first();

    return {
        items: rows.map(r => ({
            ...r,
            invoice_amount_eur: r.invoice_amount_eur === null ? null : parseFloat(r.invoice_amount_eur),
            invoice_amount_huf: r.invoice_amount_huf === null ? null : parseFloat(r.invoice_amount_huf),
            days_outstanding: r.days_outstanding === null ? null : parseInt(r.days_outstanding, 10)
        })),
        summary: {
            total_open_eur: parseFloat(totals.total_open_eur) || 0,
            total_open_huf: parseFloat(totals.total_open_huf) || 0,
            count: parseInt(totals.count, 10)
        }
    };
}

async function getProductTurnover({ season_code, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 15;
    if (lim > 50) lim = 50;

    const q = db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .leftJoin('products as pr', 'sl.product_id', 'pr.id')
        .select(db.raw("COALESCE(pr.id, 0) as product_id"), db.raw("COALESCE(pr.name, 'Ismeretlen termék') as product_name"))
        .sum('sl.kgs_finance as total_kgs')
        .sum('sl.boxes as total_boxes')
        .sum('sl.net_amount as total_net_amount')
        .groupByRaw("COALESCE(pr.id, 0), COALESCE(pr.name, 'Ismeretlen termék')")
        .orderBy('total_net_amount', 'desc')
        .limit(lim);

    if (season_code) {
        q.join('seasons as se', 's.season_id', 'se.id').where('se.code', season_code);
    }

    const rows = await q;
    return {
        products: rows.map(r => ({
            product_id: r.product_id,
            product_name: r.product_name,
            total_kgs: parseFloat(r.total_kgs) || 0,
            total_boxes: parseFloat(r.total_boxes) || 0,
            total_net_amount: parseFloat(r.total_net_amount) || 0
        })),
        count: rows.length
    };
}

async function getSeasonComparison({ season_codes } = {}) {
    let seasons;
    if (Array.isArray(season_codes) && season_codes.length > 0) {
        const codes = season_codes.slice(0, 10).map(String);
        seasons = await db('seasons').whereIn('code', codes).orderBy('start_date', 'asc');
    } else {
        seasons = await db('seasons').orderBy('start_date', 'desc').limit(3);
        seasons.reverse();
    }
    if (seasons.length === 0) {
        return { error: 'Nem található szezon a megadott kódokkal.' };
    }
    const seasonIds = seasons.map(s => s.id);

    const shipmentRows = await db('shipments')
        .whereIn('season_id', seasonIds)
        .select('season_id')
        .count('* as shipment_count')
        .groupBy('season_id');

    const revenueRows = await db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .whereIn('s.season_id', seasonIds)
        .select('s.season_id')
        .sum('sl.net_amount as total_net_amount')
        .sum('sl.kgs_finance as total_kgs')
        .groupBy('s.season_id');

    const transportRows = await db('finance_transport_lines as ftl')
        .join('shipments as s', 'ftl.shipment_id', 's.id')
        .whereIn('s.season_id', seasonIds)
        .select('s.season_id')
        .sum('ftl.amount as total_transport_cost')
        .groupBy('s.season_id');

    const byShipment = Object.fromEntries(shipmentRows.map(r => [r.season_id, parseInt(r.shipment_count, 10)]));
    const byRevenue = Object.fromEntries(revenueRows.map(r => [r.season_id, r]));
    const byTransport = Object.fromEntries(transportRows.map(r => [r.season_id, r]));

    return {
        seasons: seasons.map(s => ({
            season_code: s.code,
            shipment_count: byShipment[s.id] || 0,
            total_net_amount: parseFloat(byRevenue[s.id]?.total_net_amount) || 0,
            total_transport_cost: parseFloat(byTransport[s.id]?.total_transport_cost) || 0,
            total_kgs: parseFloat(byRevenue[s.id]?.total_kgs) || 0
        }))
    };
}

async function getUnitCostOverview({ season_code, product_limit } = {}) {
    let lim = parseInt(product_limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 15;
    if (lim > 50) lim = 50;

    const q = db('finance_unit_cost_lines as fuc')
        .join('shipments as s', 'fuc.shipment_id', 's.id')
        .leftJoin('products as pr', 'fuc.product_id', 'pr.id')
        .select(db.raw("COALESCE(pr.name, fuc.description, 'Ismeretlen termék') as product_name"))
        .sum('fuc.netto_kgs as total_netto_kgs')
        .select(
            db.raw('SUM(fuc.price_per_kg * fuc.netto_kgs) / NULLIF(SUM(fuc.netto_kgs), 0) as avg_price_per_kg'),
            db.raw('SUM(fuc.trans_per_kg * fuc.netto_kgs) / NULLIF(SUM(fuc.netto_kgs), 0) as avg_trans_per_kg'),
            db.raw('SUM(fuc.tot_cost_per_kg * fuc.netto_kgs) / NULLIF(SUM(fuc.netto_kgs), 0) as avg_tot_cost_per_kg')
        )
        .groupByRaw("COALESCE(pr.name, fuc.description, 'Ismeretlen termék')")
        .orderBy('total_netto_kgs', 'desc')
        .limit(lim);

    if (season_code) {
        q.join('seasons as se', 's.season_id', 'se.id').where('se.code', season_code);
    }

    const rows = await q;
    return {
        products: rows.map(r => {
            const avgPrice = parseFloat(r.avg_price_per_kg) || 0;
            const avgCost = parseFloat(r.avg_tot_cost_per_kg) || 0;
            return {
                product_name: r.product_name,
                total_netto_kgs: parseFloat(r.total_netto_kgs) || 0,
                avg_price_per_kg: avgPrice,
                avg_trans_per_kg: parseFloat(r.avg_trans_per_kg) || 0,
                avg_tot_cost_per_kg: avgCost,
                margin_per_kg: avgPrice - avgCost
            };
        }),
        count: rows.length
    };
}

// Partner megkeresése id vagy név alapján – a partner-témájú tool-ok közös segédje
async function findPartner({ partner_id, partner_name } = {}) {
    if (partner_id) {
        const p = await db('partners').where('id', partner_id).first();
        if (!p) {
            return { error: `Nem található partner a megadott azonosítóval (id: ${partner_id}).` };
        }
        return { partner: p };
    }
    if (partner_name && String(partner_name).trim()) {
        const p = await db('partners')
            .whereILike('name', `%${String(partner_name).trim()}%`)
            .orderBy('name')
            .first();
        if (!p) {
            return { error: `Nem található partner a megadott névvel: ${partner_name}` };
        }
        return { partner: p };
    }
    return { error: 'Adj meg partner_id-t vagy partner_name-et.' };
}

async function getPartnerDetails({ partner_id, partner_name } = {}) {
    const found = await findPartner({ partner_id, partner_name });
    if (found.error) return found;
    const p = found.partner;

    const [sites, communications, contacts, identifiers, bankAccounts, creditSettings, categories, restrictions, discounts, events] = await Promise.all([
        db('partner_sites')
            .where('partner_id', p.id)
            .where('is_deleted', false)
            .select('id', 'name', 'country', 'zip', 'city', 'street_name', 'street_type', 'street_number')
            .limit(50),
        db('partner_communications')
            .where('partner_id', p.id)
            .select('id', 'site_id', 'channel_type', 'value')
            .limit(100),
        db('partner_contacts')
            .where('partner_id', p.id)
            .select('id', 'site_id', 'name', 'title')
            .limit(100),
        db('partner_identifiers')
            .where('partner_id', p.id)
            .select('id', 'id_type', 'value', 'is_verified', 'is_inactive')
            .limit(100),
        db('partner_bank_accounts')
            .where('partner_id', p.id)
            .select('id', 'account_number', 'bank_name', 'is_primary')
            .limit(50),
        db('partner_credit_settings')
            .where('partner_id', p.id)
            .select('credit_limit', 'late_interest_pct', 'group_collection', 'collection_account')
            .first(),
        db('partner_categories')
            .where('partner_id', p.id)
            .select('category')
            .limit(50),
        db('partner_restrictions')
            .where('partner_id', p.id)
            .select('id', 'operation_name', 'ban_start')
            .limit(50),
        db('partner_discounts')
            .where('partner_id', p.id)
            .select('id', 'product_group', 'discount_pct')
            .limit(50),
        db('partner_events')
            .where('partner_id', p.id)
            .select('id', 'event_date', 'event_type', 'name', 'created_by')
            .orderBy('event_date', 'desc')
            .limit(20)
    ]);

    return {
        partner: {
            id: p.id, name: p.name, type: p.type,
            is_active: p.is_active, is_inactive: p.is_inactive,
            address: p.address, contact: p.contact,
            country: p.country, zip: p.zip, city: p.city,
            invoice_name: p.invoice_name, gln: p.gln, tax_id: p.tax_id,
            currency: p.currency, payment_method: p.payment_method, notes: p.notes
        },
        sites,
        communications,
        contacts,
        identifiers,
        bank_accounts: bankAccounts,
        credit_settings: creditSettings || null,
        categories: categories.map(c => c.category),
        restrictions,
        discounts,
        recent_events: events
    };
}

async function getPartnerHistory({ partner_id, partner_name } = {}) {
    const found = await findPartner({ partner_id, partner_name });
    if (found.error) return found;
    const p = found.partner;

    // Szezononkénti forgalom a partner bevételi soraiból
    const seasonRows = await db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .join('seasons as se', 's.season_id', 'se.id')
        .where('sl.partner_id', p.id)
        .select('se.code as season_code')
        .sum('sl.net_amount as total_net_amount')
        .sum('sl.kgs_finance as total_kgs')
        .countDistinct('s.id as shipment_count')
        .groupBy('se.code', 'se.start_date')
        .orderBy('se.start_date', 'desc');

    // Legutóbbi fuvarjai
    const recentRows = await db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .join('seasons as se', 's.season_id', 'se.id')
        .leftJoin('products as pr', 'sl.product_id', 'pr.id')
        .where('sl.partner_id', p.id)
        .select(
            's.id as shipment_id', 's.order_number', 'se.code as season_code',
            's.loading_date', 's.finance_status', 'pr.name as product_name',
            'sl.destination', 'sl.kgs_finance', 'sl.net_amount'
        )
        .orderBy('s.loading_date', 'desc')
        .limit(15);

    return {
        partner: { id: p.id, name: p.name, type: p.type },
        turnover_by_season: seasonRows.map(r => ({
            season_code: r.season_code,
            total_net_amount: parseFloat(r.total_net_amount) || 0,
            total_kgs: parseFloat(r.total_kgs) || 0,
            shipment_count: parseInt(r.shipment_count, 10)
        })),
        recent_lines: recentRows
    };
}

async function listPartnerEvents({ partner_id, partner_name, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 25;
    if (lim > 100) lim = 100;

    const q = db('partner_events as pe')
        .leftJoin('partners as p', 'pe.partner_id', 'p.id')
        .select('pe.id', 'p.name as partner_name', 'pe.event_date', 'pe.event_type', 'pe.name', 'pe.created_by')
        .orderBy('pe.event_date', 'desc')
        .limit(lim);

    if (partner_id) {
        q.where('pe.partner_id', partner_id);
    } else if (partner_name) {
        q.whereILike('p.name', `%${String(partner_name).trim()}%`);
    }

    const rows = await q;
    return { events: rows, count: rows.length };
}

async function getUnfulfilledCargoDemands({ product_query, partner_query, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 50;
    if (lim > 100) lim = 100;

    const q = db('cargo_demands as cd')
        .leftJoin('products as pr', 'cd.product_id', 'pr.id')
        .where('cd.is_fulfilled', false)
        .select(
            'cd.id', db.raw("COALESCE(pr.name, cd.product_name, 'Ismeretlen termék') as product_name"),
            'cd.partner_name', 'cd.customer_name', 'cd.euro_palets', 'cd.normal_palets',
            'cd.destination', 'cd.gross_weight_kg', 'cd.price_eur', 'cd.notes', 'cd.created_at'
        )
        .orderBy('cd.created_at', 'desc')
        .limit(lim);

    if (product_query) {
        q.where(function () {
            this.whereILike('pr.name', `%${String(product_query).trim()}%`)
                .orWhereILike('cd.product_name', `%${String(product_query).trim()}%`);
        });
    }
    if (partner_query) {
        q.whereILike('cd.partner_name', `%${String(partner_query).trim()}%`);
    }

    const rows = await q;
    return { demands: rows, count: rows.length };
}

async function getLoadingStatus({ season_code, include_loaded, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 25;
    if (lim > 50) lim = 50;

    const q = db('loading_events as le')
        .leftJoin('shipments as s', 'le.shipment_id', 's.id')
        .leftJoin('seasons as se', 's.season_id', 'se.id')
        .select(
            'le.id as loading_event_id', 's.order_number', 'se.code as season_code',
            'le.loading_date', 'le.loading_place', 'le.is_loaded', 'le.loaded_at'
        )
        .orderBy('le.loading_date', 'desc')
        .limit(lim);

    if (!include_loaded) q.where('le.is_loaded', false);
    if (season_code) q.where('se.code', season_code);

    const events = await q;
    if (events.length === 0) {
        return { events: [], count: 0 };
    }

    // Áruigény-összesítés eseményenként
    const eventIds = events.map(e => e.loading_event_id);
    const demandRows = await db('product_demands')
        .whereIn('loading_event_id', eventIds)
        .select('loading_event_id')
        .count('* as demand_count')
        .sum('pallet_count as total_pallets')
        .select(db.raw('SUM(CASE WHEN is_sent_to_truck THEN 1 ELSE 0 END) as sent_count'))
        .groupBy('loading_event_id');
    const byEvent = Object.fromEntries(demandRows.map(r => [r.loading_event_id, r]));

    return {
        events: events.map(e => ({
            ...e,
            demand_count: parseInt(byEvent[e.loading_event_id]?.demand_count, 10) || 0,
            total_pallets: parseFloat(byEvent[e.loading_event_id]?.total_pallets) || 0,
            sent_to_truck_count: parseInt(byEvent[e.loading_event_id]?.sent_count, 10) || 0
        })),
        count: events.length
    };
}

async function getUnreceivedLines({ start_date, end_date, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 50;
    if (lim > 100) lim = 100;

    const q = db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .join('seasons as se', 's.season_id', 'se.id')
        .leftJoin('products as pr', 'sl.product_id', 'pr.id')
        .leftJoin('partners as p', 'sl.partner_id', 'p.id')
        .where('sl.is_received', false)
        .select(
            'sl.id as line_id', 's.order_number', 'se.code as season_code',
            's.loading_date', db.raw("COALESCE(pr.name, 'Ismeretlen termék') as product_name"),
            db.raw("COALESCE(p.name, sl.customer, 'Ismeretlen partner') as partner_name"),
            'sl.destination', 'sl.euro_palets', 'sl.normal_palets', 'sl.gross_weight_kg', 'sl.albaran_number'
        )
        .orderBy('s.loading_date', 'desc')
        .limit(lim);

    if (start_date) q.where('s.loading_date', '>=', start_date);
    if (end_date) q.where('s.loading_date', '<=', end_date);

    const rows = await q;
    return { lines: rows, count: rows.length };
}

async function getDocumentStatus({ season_code, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 25;
    if (lim > 50) lim = 50;

    let season = null;
    if (season_code) {
        season = await db('seasons').where('code', season_code).first();
        if (!season) {
            return { error: `Nem található szezon a megadott kóddal: ${season_code}` };
        }
    }

    // A GHU/LOG bontás csak akkor, ha a külön státuszmezők már léteznek (016-os migráció)
    const hasGhuLog = await db.schema.hasColumn('transport_orders', 'is_sent_ghu');
    const ghuLogSelects = hasGhuLog
        ? [db.raw('SUM(CASE WHEN is_sent_ghu THEN 1 ELSE 0 END) as sent_ghu'),
           db.raw('SUM(CASE WHEN is_sent_log THEN 1 ELSE 0 END) as sent_log')]
        : [db.raw('NULL as sent_ghu'), db.raw('NULL as sent_log')];

    // Fuvarmegbízások összesítése GHU/LOG bontásban
    const ordersQ = db('transport_orders');
    if (season) ordersQ.where('season_id', season.id);
    const orderSummary = await ordersQ.clone().select(
        db.raw('COUNT(*) as total'),
        db.raw('SUM(CASE WHEN is_sent THEN 1 ELSE 0 END) as sent'),
        ...ghuLogSelects
    ).first();

    // EKAER-ek összesítése
    const ekaerQ = db('ekaer_records');
    if (season) ekaerQ.where('season_id', season.id);
    const ekaerSummary = await ekaerQ.clone().select(
        db.raw('COUNT(*) as total'),
        db.raw('SUM(CASE WHEN is_sent THEN 1 ELSE 0 END) as sent'),
        ...ghuLogSelects
    ).first();

    // Nem elküldött tételek listája
    const ghuLogCols = hasGhuLog ? ['to2.is_sent_ghu', 'to2.is_sent_log'] : [];
    const unsentOrdersQ = db('transport_orders as to2')
        .leftJoin('shipments as s', 'to2.shipment_id', 's.id')
        .leftJoin('transporters as t', 'to2.transporter_id', 't.id')
        .where('to2.is_sent', false)
        .select('to2.id', 's.order_number', 't.name as transporter_name', 'to2.document_name', 'to2.loading_date', ...ghuLogCols)
        .orderBy('to2.loading_date', 'desc')
        .limit(lim);
    if (season) unsentOrdersQ.where('to2.season_id', season.id);

    const ghuLogColsEr = hasGhuLog ? ['er.is_sent_ghu', 'er.is_sent_log'] : [];
    const unsentEkaerQ = db('ekaer_records as er')
        .leftJoin('shipments as s', 'er.shipment_id', 's.id')
        .leftJoin('transporters as t', 'er.transporter_id', 't.id')
        .where('er.is_sent', false)
        .select('er.id', 's.order_number', 't.name as transporter_name', 'er.ekaer_file_name', 'er.load_date', ...ghuLogColsEr)
        .orderBy('er.load_date', 'desc')
        .limit(lim);
    if (season) unsentEkaerQ.where('er.season_id', season.id);

    const [unsentOrders, unsentEkaer] = await Promise.all([unsentOrdersQ, unsentEkaerQ]);

    const summarize = (row) => ({
        total: parseInt(row.total, 10) || 0,
        sent: parseInt(row.sent, 10) || 0,
        unsent: (parseInt(row.total, 10) || 0) - (parseInt(row.sent, 10) || 0),
        sent_ghu: parseInt(row.sent_ghu, 10) || 0,
        sent_log: parseInt(row.sent_log, 10) || 0
    });

    return {
        season: season ? season.code : 'mind',
        transport_orders: summarize(orderSummary),
        ekaer_records: summarize(ekaerSummary),
        unsent_transport_orders: unsentOrders,
        unsent_ekaer_records: unsentEkaer
    };
}

async function getPalletStatistics({ season_code, start_date, end_date, group_by, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 15;
    if (lim > 50) lim = 50;

    const allowedGroupBy = ['product', 'partner', 'destination', 'month'];
    const gb = allowedGroupBy.includes(group_by) ? group_by : 'product';

    // Számított összesített raklapszám a v_shipment_costs nézetből (normál->euró átváltással)
    const q = db('v_shipment_costs as v')
        .join('shipment_lines as sl', 'v.line_id', 'sl.id')
        .join('shipments as s', 'v.shipment_id', 's.id')
        .leftJoin('products as pr', 'sl.product_id', 'pr.id')
        .leftJoin('partners as p', 'sl.partner_id', 'p.id')
        .sum('v.calculated_total_palets as total_palets')
        .sum('sl.euro_palets as euro_palets')
        .sum('sl.normal_palets as normal_palets')
        .countDistinct('s.id as shipment_count');

    if (season_code) {
        q.join('seasons as se', 's.season_id', 'se.id').where('se.code', season_code);
    }
    if (start_date) q.where('s.loading_date', '>=', start_date);
    if (end_date) q.where('s.loading_date', '<=', end_date);

    if (gb === 'product') {
        q.select(db.raw("COALESCE(pr.name, 'Ismeretlen termék') as group_key"))
            .groupByRaw("COALESCE(pr.name, 'Ismeretlen termék')");
    } else if (gb === 'partner') {
        q.select(db.raw("COALESCE(p.name, sl.customer, 'Ismeretlen partner') as group_key"))
            .groupByRaw("COALESCE(p.name, sl.customer, 'Ismeretlen partner')");
    } else if (gb === 'destination') {
        q.select(db.raw("COALESCE(sl.destination, 'Ismeretlen lerakóhely') as group_key"))
            .groupByRaw("COALESCE(sl.destination, 'Ismeretlen lerakóhely')");
    } else {
        q.select(db.raw("TO_CHAR(s.loading_date, 'YYYY-MM') as group_key"))
            .groupByRaw("TO_CHAR(s.loading_date, 'YYYY-MM')");
    }
    q.orderBy('total_palets', 'desc').limit(lim);

    const rows = await q;
    return {
        group_by: gb,
        groups: rows.map(r => ({
            group_key: r.group_key,
            total_palets: parseFloat(r.total_palets) || 0,
            euro_palets: parseFloat(r.euro_palets) || 0,
            normal_palets: parseFloat(r.normal_palets) || 0,
            shipment_count: parseInt(r.shipment_count, 10)
        }))
    };
}

async function getTransportCostLines({ season_code, type_supp, partner_query, order_number, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 50;
    if (lim > 100) lim = 100;

    const q = db('finance_transport_lines as ftl')
        .join('shipments as s', 'ftl.shipment_id', 's.id')
        .leftJoin('partners as p', 'ftl.partner_id', 'p.id')
        .leftJoin('currencies as c', 'ftl.currency_id', 'c.id')
        .select(
            'ftl.id', 's.order_number', 'ftl.date_entry', 'ftl.type_supp', 'ftl.type_a',
            db.raw("COALESCE(p.name, ftl.ref_name, 'Ismeretlen partner') as partner_name"),
            'ftl.invoice_number', 'ftl.description', 'ftl.amount', 'ftl.tax_percent',
            'ftl.tax_amount', 'ftl.tot_invoice', db.raw("COALESCE(c.code, 'N/A') as currency"),
            'ftl.exchange_rate', 'ftl.total_inv_local'
        )
        .orderBy('ftl.date_entry', 'desc')
        .limit(lim);

    if (season_code) {
        q.join('seasons as se', 's.season_id', 'se.id').where('se.code', season_code);
    }
    if (type_supp) q.whereILike('ftl.type_supp', `%${String(type_supp).trim()}%`);
    if (partner_query) {
        q.where(function () {
            this.whereILike('p.name', `%${String(partner_query).trim()}%`)
                .orWhereILike('ftl.ref_name', `%${String(partner_query).trim()}%`);
        });
    }
    if (order_number) q.where('s.order_number', order_number);

    const rows = await q;
    return { lines: rows, count: rows.length };
}

async function getVatReport({ season_code, start_date, end_date } = {}) {
    // ÁFA-kimutatás a bevételi sorokból, áfakulcs és hónap szerint
    const q = db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .select(
            db.raw("TO_CHAR(s.loading_date, 'YYYY-MM') as month"),
            db.raw("COALESCE(sl.tax_percent, 0) as tax_percent")
        )
        .sum('sl.net_amount as total_net_amount')
        .sum('sl.tax_amount as total_tax_amount')
        .sum('sl.amount_a as total_gross_amount')
        .count('sl.id as line_count')
        .groupByRaw("TO_CHAR(s.loading_date, 'YYYY-MM'), COALESCE(sl.tax_percent, 0)")
        .orderByRaw("TO_CHAR(s.loading_date, 'YYYY-MM') asc, COALESCE(sl.tax_percent, 0) asc");

    if (season_code) {
        q.join('seasons as se', 's.season_id', 'se.id').where('se.code', season_code);
    }
    if (start_date) q.where('s.loading_date', '>=', start_date);
    if (end_date) q.where('s.loading_date', '<=', end_date);

    const rows = await q;
    return {
        rows: rows.map(r => ({
            month: r.month,
            tax_percent: parseFloat(r.tax_percent) || 0,
            total_net_amount: parseFloat(r.total_net_amount) || 0,
            total_tax_amount: parseFloat(r.total_tax_amount) || 0,
            total_gross_amount: parseFloat(r.total_gross_amount) || 0,
            line_count: parseInt(r.line_count, 10)
        })),
        count: rows.length
    };
}

async function getCreditLimitUsage({ limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 25;
    if (lim > 50) lim = 50;

    const settings = await db('partner_credit_settings as pcs')
        .join('partners as p', 'pcs.partner_id', 'p.id')
        .select('p.id as partner_id', 'p.name as partner_name', 'p.is_inactive',
            'pcs.credit_limit', 'pcs.late_interest_pct', 'pcs.group_collection')
        .whereNotNull('pcs.credit_limit')
        .orderBy('pcs.credit_limit', 'desc')
        .limit(lim);

    if (settings.length === 0) {
        return { partners: [], count: 0 };
    }

    // Nyitott (Open státuszú) fuvarok sorainak bruttó értéke partnerenként
    const partnerIds = settings.map(s => s.partner_id);
    const openRows = await db('shipment_lines as sl')
        .join('shipments as s', 'sl.shipment_id', 's.id')
        .whereIn('sl.partner_id', partnerIds)
        .where('s.finance_status', 'Open')
        .select('sl.partner_id')
        .sum('sl.amount_a as open_gross_amount')
        .countDistinct('s.id as open_shipment_count')
        .groupBy('sl.partner_id');
    const byPartner = Object.fromEntries(openRows.map(r => [r.partner_id, r]));

    return {
        partners: settings.map(s => {
            const creditLimit = parseFloat(s.credit_limit) || 0;
            const openGross = parseFloat(byPartner[s.partner_id]?.open_gross_amount) || 0;
            return {
                partner_id: s.partner_id,
                partner_name: s.partner_name,
                is_inactive: s.is_inactive,
                credit_limit: creditLimit,
                late_interest_pct: s.late_interest_pct === null ? null : parseFloat(s.late_interest_pct),
                group_collection: s.group_collection,
                open_gross_amount: openGross,
                open_shipment_count: parseInt(byPartner[s.partner_id]?.open_shipment_count, 10) || 0,
                credit_limit_usage_pct: creditLimit > 0 ? Math.round((openGross / creditLimit) * 10000) / 100 : null
            };
        }),
        count: settings.length
    };
}

async function getTransporterPerformance({ season_code } = {}) {
    const q = db('shipments as s')
        .join('transporters as t', 's.transporter_id', 't.id')
        .select('t.id as transporter_id', 't.name as transporter_name', 's.transport_currency as currency')
        .count('s.id as shipment_count')
        .avg('s.transport_price as avg_transport_price')
        .sum('s.transport_price as total_transport_price')
        .select(db.raw('AVG(s.unloading_date - s.loading_date) as avg_transit_days'))
        .groupBy('t.id', 't.name', 's.transport_currency')
        .orderBy('shipment_count', 'desc')
        .limit(25);

    if (season_code) {
        q.join('seasons as se', 's.season_id', 'se.id').where('se.code', season_code);
    }

    const rows = await q;
    return {
        transporters: rows.map(r => ({
            transporter_id: r.transporter_id,
            transporter_name: r.transporter_name,
            currency: r.currency,
            shipment_count: parseInt(r.shipment_count, 10),
            avg_transport_price: parseFloat(r.avg_transport_price) || 0,
            total_transport_price: parseFloat(r.total_transport_price) || 0,
            avg_transit_days: r.avg_transit_days === null ? null : parseFloat(r.avg_transit_days)
        })),
        count: rows.length
    };
}

async function listProducts({ query, active_only, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 50;
    if (lim > 100) lim = 100;

    const q = db('products')
        .select('id', 'name', 'name_hu', 'code', 'category', 'reference', 'is_active')
        .orderBy('name')
        .limit(lim);

    if (query && String(query).trim()) {
        const term = `%${String(query).trim()}%`;
        q.where(function () {
            this.whereILike('name', term).orWhereILike('name_hu', term);
        });
    }
    if (active_only !== false) q.where('is_active', true);

    const rows = await q;
    return { products: rows, count: rows.length };
}

async function listTransporters({ active_only } = {}) {
    const q = db('transporters')
        .select('id', 'name', 'code', 'is_active')
        .orderBy('name');
    if (active_only !== false) q.where('is_active', true);

    const rows = await q;
    return { transporters: rows, count: rows.length };
}

async function searchPartnerIdentifiers({ value, id_type, limit } = {}) {
    let lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 25;
    if (lim > 50) lim = 50;

    if ((!value || !String(value).trim()) && (!id_type || !String(id_type).trim())) {
        return { identifiers: [], message: 'Adj meg value-t vagy id_type-ot a kereséshez.' };
    }

    const q = db('partner_identifiers as pi')
        .join('partners as p', 'pi.partner_id', 'p.id')
        .select('p.id as partner_id', 'p.name as partner_name', 'pi.id_type', 'pi.value', 'pi.is_verified', 'pi.is_inactive')
        .orderBy('p.name')
        .limit(lim);

    if (value && String(value).trim()) {
        q.whereILike('pi.value', `%${String(value).trim()}%`);
    }
    if (id_type && String(id_type).trim()) {
        q.whereILike('pi.id_type', `%${String(id_type).trim()}%`);
    }

    const rows = await q;
    return { identifiers: rows, count: rows.length };
}

/**
 * A megadott tool futtatása név és argumentumok alapján.
 * Hiba esetén {error: "..."} objektumot ad vissza – sosem dob exceptiont.
 */
async function executeErpTool(name, args) {
    try {
        switch (name) {
            case 'list_seasons':
                return await listSeasons();
            case 'search_partners':
                return await searchPartners(args || {});
            case 'list_shipments':
                return await listShipments(args || {});
            case 'get_shipment_finance':
                return await getShipmentFinance(args || {});
            case 'get_season_finance_summary':
                return await getSeasonFinanceSummary(args || {});
            case 'get_financial_turnover':
                return await getFinancialTurnover(args || {});
            case 'get_top_partners_by_turnover':
                return await getTopPartnersByTurnover(args || {});
            case 'get_monthly_turnover_trend':
                return await getMonthlyTurnoverTrend(args || {});
            case 'get_transport_cost_analysis':
                return await getTransportCostAnalysis(args || {});
            case 'get_outstanding_payments':
                return await getOutstandingPayments(args || {});
            case 'get_product_turnover':
                return await getProductTurnover(args || {});
            case 'get_season_comparison':
                return await getSeasonComparison(args || {});
            case 'get_unit_cost_overview':
                return await getUnitCostOverview(args || {});
            case 'get_partner_details':
                return await getPartnerDetails(args || {});
            case 'get_partner_history':
                return await getPartnerHistory(args || {});
            case 'list_partner_events':
                return await listPartnerEvents(args || {});
            case 'get_unfulfilled_cargo_demands':
                return await getUnfulfilledCargoDemands(args || {});
            case 'get_loading_status':
                return await getLoadingStatus(args || {});
            case 'get_unreceived_lines':
                return await getUnreceivedLines(args || {});
            case 'get_document_status':
                return await getDocumentStatus(args || {});
            case 'get_pallet_statistics':
                return await getPalletStatistics(args || {});
            case 'get_transport_cost_lines':
                return await getTransportCostLines(args || {});
            case 'get_vat_report':
                return await getVatReport(args || {});
            case 'get_credit_limit_usage':
                return await getCreditLimitUsage(args || {});
            case 'get_transporter_performance':
                return await getTransporterPerformance(args || {});
            case 'list_products':
                return await listProducts(args || {});
            case 'list_transporters':
                return await listTransporters(args || {});
            case 'search_partner_identifiers':
                return await searchPartnerIdentifiers(args || {});
            default:
                return { error: `Ismeretlen tool: ${name}` };
        }
    } catch (error) {
        console.error(`ERP Tool Error (${name}):`, error.message);
        return { error: `Adatbázis hiba a(z) ${name} tool futtatása során: ${error.message}` };
    }
}

module.exports = { erpToolDefinitions, executeErpTool };
