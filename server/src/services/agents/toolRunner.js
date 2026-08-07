// Általános OpenAI function-calling futtató:
// nem-streaming hívásokkal végigjátssza a tool-hívásokat (max maxIterations kör),
// a végleges (tool-call mentes) választ pedig streameli az onDelta-nak.

// Tool-híváskor a felhasználó előtt megjelenő rövid magyar státuszüzenetek
const TOOL_STATUS = {
    list_seasons: '🔍 *Szezonok lekérdezése...*',
    search_partners: '🔍 *Partnerek keresése...*',
    list_shipments: '🔍 *Fuvarok lekérdezése...*',
    get_shipment_finance: '📊 *Fuvar teljes pénzügyi adatainak lekérdezése...*',
    get_season_finance_summary: '📊 *Szezon pénzügyi összesítésének lekérdezése...*',
    get_financial_turnover: '📊 *Pénzügyi forgalom lekérdezése...*',
    get_top_partners_by_turnover: '📊 *Top partnerek forgalmi rangsorának lekérdezése...*',
    get_monthly_turnover_trend: '📈 *Havi forgalmi trend lekérdezése...*',
    get_transport_cost_analysis: '📊 *Fuvarköltség-elemzés lekérdezése...*',
    get_outstanding_payments: '⚠️ *Nyitott pénzügyi tételek lekérdezése...*',
    get_product_turnover: '📊 *Termékenkénti forgalom lekérdezése...*',
    get_season_comparison: '📊 *Szezonok összehasonlítása...*',
    get_unit_cost_overview: '📊 *Önköltség-áttekintés lekérdezése...*',
    get_monthly_pallet_summary: '🔍 *Havi raklapforgalom lekérdezése...*',
    get_partner_details: '🔍 *Partner részletes adatainak lekérdezése...*',
    get_partner_history: '📊 *Partner forgalmi történetének lekérdezése...*',
    list_partner_events: '🔍 *Partner-események lekérdezése...*',
    get_unfulfilled_cargo_demands: '🔍 *Nyitott áruigények lekérdezése...*',
    get_loading_status: '🔍 *Rakodási állapot lekérdezése...*',
    get_unreceived_lines: '⚠️ *Be nem érkezett fuvarsorok lekérdezése...*',
    get_document_status: '📄 *Fuvarmegbízás és EKAER státusz lekérdezése...*',
    get_pallet_statistics: '📊 *Raklapstatisztika lekérdezése...*',
    get_transport_cost_lines: '📊 *Fuvarköltség-sorok lekérdezése...*',
    get_vat_report: '📊 *ÁFA-kimutatás készítése...*',
    get_credit_limit_usage: '⚠️ *Hitelkeret-kihasználtság lekérdezése...*',
    get_transporter_performance: '📊 *Fuvarozói teljesítmény lekérdezése...*',
    list_products: '🔍 *Terméktörzs lekérdezése...*',
    list_transporters: '🔍 *Fuvarozótörzs lekérdezése...*',
    search_partner_identifiers: '🔍 *Partner-azonosítók keresése...*'
};

/**
 * @param {object} opts
 * @param {object} opts.openai - OpenAI SDK példány
 * @param {string} opts.model - chat modell
 * @param {string} opts.systemPrompt - rendszerprompt
 * @param {Array} opts.messages - beszélgetésüzenetek (system nélkül is lehet)
 * @param {Array} opts.tools - OpenAI tools definíciók
 * @param {function} opts.executeTool - (name, args) => Promise<object>
 * @param {function|null} opts.onDelta - streaming callback
 * @param {number} opts.maxIterations - max tool-hívási kör (alap 5)
 */
async function runWithTools({ openai, model, systemPrompt, messages, tools, executeTool, onDelta = null, maxIterations = 5 }) {
    const msgs = [{ role: 'system', content: systemPrompt }, ...messages];

    for (let i = 0; i < maxIterations; i++) {
        const response = await openai.chat.completions.create({
            model,
            messages: msgs,
            tools,
            tool_choice: 'auto'
        });

        const choice = response.choices[0];
        const msg = choice.message;
        const toolCalls = msg.tool_calls || [];

        // Nincs tool-hívás – ez a végleges válasz, streamelve küldjük
        if (toolCalls.length === 0) {
            if (onDelta) {
                const stream = await openai.chat.completions.create({
                    model,
                    messages: msgs,
                    stream: true
                });
                let full = '';
                for await (const chunk of stream) {
                    const delta = chunk.choices?.[0]?.delta?.content || '';
                    if (delta) {
                        full += delta;
                        onDelta(delta);
                    }
                }
                return full;
            }
            return msg.content || '';
        }

        // Tool-hívások végrehajtása sorban
        // Az assistant üzenetet a tool_calls mezővel együtt visszatesszük (OpenAI protokoll)
        msgs.push(msg);

        for (const tc of toolCalls) {
            const toolName = tc.function.name;
            let toolArgs = {};
            try {
                toolArgs = JSON.parse(tc.function.arguments || '{}');
            } catch (_) {
                toolArgs = {};
            }

            console.log(`[AI Tool] ${toolName}(${JSON.stringify(toolArgs)})`);

            // Rövid státuszüzenet a felhasználónak a tool futtatása előtt
            if (onDelta) {
                onDelta(`${TOOL_STATUS[toolName] || `🔍 *${toolName} futtatása...*`}\n\n`);
            }

            const result = await executeTool(toolName, toolArgs);

            msgs.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(result)
            });
        }
    }

    // Max iteráció elérve – még egy utolsó, tool nélküli hívás a válaszhoz
    const finalResponse = await openai.chat.completions.create({
        model,
        messages: msgs
    });
    const finalContent = finalResponse.choices[0].message.content || '';
    if (onDelta) onDelta(finalContent);
    return finalContent;
}

module.exports = { runWithTools };
