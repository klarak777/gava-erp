const db = require('../../db/db');

// ERP adatasszisztens: élő PostgreSQL lekérdezések fix, read-only tool-okkal.
class ErpDataAgent {
    constructor(openai) {
        this.openai = openai;
    }

    async process(message, documentId = null, history = [], uiContext = null, onEvent = null) {
        let systemPrompt = `Te az ERP Adat Divízió mesterséges intelligencia asszisztense vagy.
Feladatod a felhasználó segítése az SQL adatbázis tartalmának olvasásában és szerkesztésében.
Használd a rendelkezésedre álló funkciókat (tool-okat) az adatok lekérdezéséhez, illetve ha a felhasználó módosítást kér, használd a javaslat-generáló funkciókat (pl. propose_update_partner).

1. Szigorúan az adatbázisból származó tényekre támaszkodj.
2. Ne találj ki adatokat.
3. Csak azt jelenítsd meg, amit a funkciók visszaadtak.
4. Ha a felhasználó azt kérdezi, hogy milyen ablak/oldal van nyitva, vagy van-e hozzáférésed, akkor az "UI Kontextus" alapján válaszold meg, hogy éppen mit látsz a képernyőjén. Nyugtasd meg, hogy élő és biztonságos SQL adatbázis hozzáférésed is van az ERP-hez.
5. Soha ne módosíts közvetlenül adatot (nincs is hozzá jogod). Ehelyett használd a "propose_*" függvényeket, amelyek legenerálják a jóváhagyási kártyát a felhasználónak.

Grafikon (chart-spec):
- Ha grafikon illik a válaszhoz (például adatok vizuális összehasonlítása), a szöveg végén tegyél egy vagy több ilyen blokkot (pontosan így):
\`\`\`chart
{"type": "bar", "title": "Fuvarok száma", "labels": ["Szezon 24-25", "Szezon 25-26"], "datasets": [{"label": "Darab", "data": [120, 150]}]}
\`\`\`
- Támogatott type értékek: bar, line, pie, doughnut.

Gyorsgombok (quick replies):
- Ha kérdésed van a felhasználóhoz egy elemzéssel kapcsolatban (pl. további szűrés, vagy következő lépés), adj meg 2-4 válaszlehetőséget a válaszod LEGUTOLSÓ sorában ebben a formátumban:
[QUICK_REPLIES: Első lehetőség | Második lehetőség | Harmadik lehetőség]
`;

        if (uiContext && uiContext.length > 0) {
            systemPrompt += `\n\nUI Kontextus (A felhasználó jelenleg megnyitott ablakai):\n`;
            uiContext.forEach(win => {
                systemPrompt += `- Ablak címe: ${win.title} (Aktív: ${win.isActive ? 'Igen' : 'Nem'})\n`;
                if (win.formData && Object.keys(win.formData).length > 0) {
                    systemPrompt += `  Űrlapmezők:\n`;
                    for (const [key, value] of Object.entries(win.formData)) {
                        systemPrompt += `    ${key}: ${value}\n`;
                    }
                }
            });
        }

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        for (const h of history.slice(-10)) {
            if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
                messages.push({ role: h.role, content: String(h.content).slice(0, 2000) });
            }
        }
        messages.push({ role: 'user', content: message });

        const tools = [
            {
                type: "function",
                function: {
                    name: "search_partners",
                    description: "Partnerek keresése név alapján az SQL adatbázisban (max 10 találat).",
                    parameters: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "A partner nevének töredéke (pl. 'GAVA')."
                            }
                        },
                        required: ["name"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_partner_details",
                    description: "Lekéri egy konkrét partner adatait az ID alapján.",
                    parameters: {
                        type: "object",
                        properties: {
                            id: {
                                type: "number",
                                description: "A partner azonosítója (ID)."
                            }
                        },
                        required: ["id"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "propose_update_partner",
                    description: "Javaslatot tesz egy partner adatainak módosítására (Jóváhagyási kártyát küld a felületre). A JSON-be csak azokat a mezőket add meg, amelyeket változtatni kell.",
                    parameters: {
                        type: "object",
                        properties: {
                            id: { type: "number", description: "A partner ID-ja." },
                            name: { type: "string" },
                            status: { type: "string", enum: ["active", "inactive"] }
                        },
                        required: ["id"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_products",
                    description: "Termékek keresése név vagy kód alapján az SQL adatbázisban.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "Terméknév vagy kód töredéke (pl. 'GRAPES' vagy 'RED GLOBE')." }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_shipment_lines",
                    description: "Fuvar/szállítólevél tételek keresése terméknév vagy dátum alapján. FIGYELEM: Ha a felhasználó a raklapforgalomra (euro_palets, normal_palets) kíváncsi, a 'raklap' nem terméknév! Ilyenkor a product_name paramétert hagyd üresen, és csak a month/year szűrőket használd, majd összegezd a raklap mezőket a kapott tételekből.",
                    parameters: {
                        type: "object",
                        properties: {
                            product_name: { type: "string", description: "Termék neve töredéke (pl. 'SYLVAN'). Ha az összes raklapforgalomra kíváncsi a felhasználó terméktől függetlenül, ezt hagyd üresen!" },
                            month: { type: "number", description: "Hónap száma (1-12)." },
                            year: { type: "number", description: "Év (pl. 2026 vagy 2025)." }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_monthly_pallet_summary",
                    description: "Havi raklapforgalmi összesítés lekérése (euro raklap, normál raklap, összes raklap, tételek és fuvarok száma) egy adott évre vonatkozóan.",
                    parameters: {
                        type: "object",
                        properties: {
                            year: { type: "number", description: "Évszám (pl. 2026)." }
                        },
                        required: ["year"]
                    }
                }
            }
        ];

        const model = process.env.AI_CHAT_MODEL || 'gpt-4o';

        // 1. First call to OpenAI to see if it wants to use a tool
        const response = await this.openai.chat.completions.create({
            model,
            messages,
            tools: tools,
            tool_choice: "auto"
        });

        const responseMessage = response.choices[0].message;

        if (responseMessage.tool_calls) {
            // Add assistant message with tool calls to conversation
            messages.push(responseMessage);

            // Execute tools
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                
                let functionResult = "";
                
                try {
                    if (functionName === 'search_partners') {
                        if (onEvent) onEvent({ delta: `\n\n*(Adatbázis keresés: partnerek keresése '${functionArgs.name}' kifejezésre)...*\n\n` });
                        const rows = await db('partners')
                            .where('name', 'ilike', `%${functionArgs.name}%`)
                            .limit(10)
                            .select('id', 'name', 'status', 'is_forwarder', 'is_carrier');
                        functionResult = JSON.stringify(rows);
                    } else if (functionName === 'get_partner_details') {
                        if (onEvent) onEvent({ delta: `\n\n*(Adatbázis keresés: partner adatok betöltése ID:${functionArgs.id})...*\n\n` });
                        const rows = await db('partners')
                            .where({ id: functionArgs.id })
                            .first();
                        functionResult = JSON.stringify(rows || { error: "Nem található partner" });
                    } else if (functionName === 'propose_update_partner') {
                        // Külön esemény típusként küldjük ki az action-t a jóváhagyó kártya rendereléséhez
                        if (onEvent) {
                            onEvent({ 
                                action: { 
                                    name: 'update_partner', 
                                    payload: functionArgs 
                                } 
                            });
                        }
                        // Visszajelzünk a modellnek, hogy a kártya sikeresen kiküldve
                        functionResult = JSON.stringify({ success: true, message: "A jóváhagyási kártya sikeresen kiküldve a felhasználónak." });
                    } else if (functionName === 'search_products') {
                        if (onEvent) onEvent({ delta: `\n\n*(Adatbázis keresés: termékek keresése '${functionArgs.query}' kifejezésre)...*\n\n` });
                        const rows = await db('products')
                            .where('name', 'ilike', `%${functionArgs.query}%`)
                            .orWhere('code', 'ilike', `%${functionArgs.query}%`)
                            .limit(10);
                        functionResult = JSON.stringify(rows);
                    } else if (functionName === 'search_shipment_lines') {
                        if (onEvent) onEvent({ delta: `\n\n*(Adatbázis keresés: fuvar tételek keresése)...*\n\n` });
                        let queryBuilder = db('shipment_lines')
                            .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
                            .leftJoin('products', 'shipment_lines.product_id', 'products.id')
                            .select('shipment_lines.*', 'shipments.loading_date', 'products.name as product_name');
                        if (functionArgs.product_name) {
                            queryBuilder = queryBuilder.where('products.name', 'ilike', `%${functionArgs.product_name}%`);
                        }
                        if (functionArgs.month) {
                            queryBuilder = queryBuilder.whereRaw('EXTRACT(MONTH FROM shipments.loading_date) = ?', [functionArgs.month]);
                        }
                        if (functionArgs.year) {
                            queryBuilder = queryBuilder.whereRaw('EXTRACT(YEAR FROM shipments.loading_date) = ?', [functionArgs.year]);
                        }
                        const rows = await queryBuilder.limit(500);
                        functionResult = JSON.stringify(rows);
                    } else if (functionName === 'get_monthly_pallet_summary') {
                        if (onEvent) onEvent({ delta: `\n\n*(Adatbázis összesítés: havi raklapforgalom lekérése a(z) ${functionArgs.year} évre)...*\n\n` });
                        const rows = await db('shipment_lines')
                            .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
                            .select(
                                db.raw('EXTRACT(MONTH FROM shipments.loading_date) as month'),
                                db.raw('SUM(shipment_lines.euro_palets) as total_euro_palets'),
                                db.raw('SUM(shipment_lines.normal_palets) as total_normal_palets'),
                                db.raw('SUM(shipment_lines.total_palets) as total_palets'),
                                db.raw('COUNT(shipment_lines.id) as line_count'),
                                db.raw('COUNT(DISTINCT shipment_lines.shipment_id) as shipment_count')
                            )
                            .whereRaw('EXTRACT(YEAR FROM shipments.loading_date) = ?', [functionArgs.year])
                            .groupByRaw('EXTRACT(MONTH FROM shipments.loading_date)')
                            .orderBy('month', 'asc');
                        functionResult = JSON.stringify(rows);
                    }
                } catch (e) {
                    console.error("Tool execution error:", e);
                    functionResult = JSON.stringify({ error: e.message });
                }

                messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: functionResult,
                });
            }

            // 2. Second call to OpenAI with tool results
            if (onEvent) {
                const stream = await this.openai.chat.completions.create({
                    model,
                    messages,
                    stream: true
                });
                let full = '';
                for await (const chunk of stream) {
                    const delta = chunk.choices?.[0]?.delta?.content || '';
                    if (delta) {
                        full += delta;
                        onEvent({ delta });
                    }
                }
                return full;
            } else {
                const finalResponse = await this.openai.chat.completions.create({
                    model,
                    messages
                });
                return finalResponse.choices[0].message.content;
            }

        } else {
            // No tools called, just return the response
            const content = responseMessage.content;
            if (onEvent && content) {
                // OpenAI already returned the full string in responseMessage,
                // but to match the streaming behavior for the caller, we send it at once.
                onEvent({ delta: content });
            }
            return content;
        }
    }
}

module.exports = ErpDataAgent;
