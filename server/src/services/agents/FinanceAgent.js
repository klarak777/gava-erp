const db = require('../../db/db');
const { erpToolDefinitions, executeErpTool } = require('./tools/erpTools');
const { runWithTools } = require('./toolRunner');

class FinanceAgent {
    constructor(openai) {
        this.openai = openai;
    }

    async generateEmbedding(text) {
        const queryEmbeddingRes = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text
        });
        const queryEmbedding = queryEmbeddingRes.data[0].embedding;
        return `[${queryEmbedding.join(',')}]`;
    }

    async searchContext(documentId, queryStr, documentIds = []) {
        const docIds = Array.isArray(documentIds) && documentIds.length
            ? documentIds.map(Number).filter(Boolean)
            : (documentId ? [Number(documentId)] : []);

        if (!docIds.length) return 'Nincs feltöltött pénzügyi dokumentum.';
        
        const embeddingStr = await this.generateEmbedding(queryStr);
        
        // Search uploaded documents with balanced per-document chunk limits
        const perDocLimit = docIds.length === 1 ? 25 : Math.max(8, Math.floor(24 / docIds.length));
        const chunkPromises = docIds.map(dId => 
            db('ai_vectors as v')
                .join('ai_documents as d', 'v.document_id', 'd.id')
                .where('v.document_id', dId)
                .select('v.content', 'd.filename')
                .orderByRaw('v.embedding <=> ?::vector', [embeddingStr])
                .limit(perDocLimit)
        );
        const results = await Promise.all(chunkPromises);
        const relevantChunks = results.flat();

        return relevantChunks.map(c => `[Forrás: ${c.filename}]\n${c.content}`).join('\n\n---\n\n');
    }

    async process(message, documentId = null, history = [], onEvent = null, documentIds = []) {
        const currentYear = new Date().getFullYear();
        const systemPrompt = `Pénzügyi és Számviteli Divízió: Te a GAVA Hungária Kft. pénzügyi mesterséges intelligencia asszisztense vagy.
Feladatod a felhasználó segítése pénzügyi, számviteli és könyvelési kérdésekben. Válaszaid legyenek precízek, számadatokra és tényekre támaszkodók.

Dátumok: A jelenlegi év ${currentYear}. Ha a felhasználó nem ad meg évet, akkor alapértelmezetten a jelenlegi évet vedd figyelembe (pl. "idei március" = ${currentYear}-03-01 és ${currentYear}-03-31 között).

Domén-ismeret:
- A pénzügyi kontrolling alapegysége az egyes FUVAR (kamion). Minden fuvarhoz tartoznak:
  - bevételi sorok (a shipment_lines pénzügyi mezői: boxes, kgs_finance, unit_price, net_amount, tax_percent, tax_amount, amount_a),
  - fuvaronkénti költségsorok (finance_transport_lines: alfuvar, útdíj, egyéb – partner, számlaszám, deviza, árfolyam szerint),
  - termékenkénti kg-os önköltség-felépítés (finance_unit_cost_lines: ár/kg, fuvarköltség/kg, változó költség/kg, overhead/kg, ÁFA).

Feladataid:
- Fuvaronkénti és szezononkénti eredmény-, fedezet- és önköltségelemzés.
- Alfuvarozói és egyéb költségek vizsgálata (partner, számlaszám, deviza, árfolyam).
- EUR/HUF árfolyamhatások elemzése.
- Kiugró értékek, hiányzó számlaszámok, szokatlan költségarányok jelzése.
- Nyitott (Open) finance státuszú fuvarok figyelése.
- Feltöltött pénzügyi dokumentumok (Excel, CSV, PDF) elemzése és összevetése az adatbázis adataival.

Szabályok:
- A rendelkezésre álló tool-okkal kérdezd le az élő adatokat az adatbázisból, és mindig tüntesd fel, mely fuvar/szezon/partner adataiból dolgozol.
- Számításokat lépésenként mutasd be.
- Devizás értékeknél add meg az árfolyamot és a forintosított értéket is.
- Soha ne találj ki adatot; ha valamilyen információ hiányzik, jelezd ezt egyértelműen.
Ha jogi aspektus is felmerül, javasold a Jogi Divízió bevonását.

Grafikon (chart-spec):
- Ha grafikon illik a válaszhoz (például adatok vizuális összehasonlítása), a szöveg végén tegyél egy vagy több ilyen blokkot (a frontend ezt a formátumot parsolja – pontosan így):
\`\`\`chart
{"type": "bar", "title": "Fuvaronkénti fedezet", "labels": ["GHU 240", "GHU 241"], "datasets": [{"label": "Fedezet (EUR)", "data": [1200, 950]}]}
\`\`\`
- Támogatott type értékek: bar, line, pie, doughnut.
- Csak valódi adatokkal rajzolj grafikont.

Gyorsgombok (quick replies):
- Ha pontosításhoz információra van szükséged a felhasználótól, SOHA ne számozott listában tedd fel a kérdéseket.
- Ehelyett írj egy rövid bevezető mondatot, majd a válasz LEGUTOLSÓ sorában add meg a lehetséges választási opciókat ilyen formában, ahol az utolsó opció mindig „Egyéb / szabad kérdés" legyen:
[QUICK_REPLIES: Első opció | Második opció | Harmadik opció | Egyéb / szabad kérdés]
- Az opciók legyenek tömörek (max 5 szó), kattintható válaszként megfogalmazva.`;

        // Gather context
        const contextText = await this.searchContext(documentId, message, documentIds);

        const userPrompt = `
Kérdés/Utasítás:
${message}

Kontextus a pénzügyi dokumentumokból:
${contextText}
`;

        const messages = [
            { role: 'system', content: systemPrompt }
        ];
        const historyAndUser = [];
        for (const h of history.slice(-10)) {
            if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
                historyAndUser.push({ role: h.role, content: String(h.content).slice(0, 2000) });
            }
        }
        historyAndUser.push({ role: 'user', content: userPrompt });

        const model = process.env.AI_CHAT_MODEL || 'gpt-6.1-sol';

        return await runWithTools({
            openai: this.openai,
            model,
            systemPrompt,
            messages: historyAndUser,
            tools: erpToolDefinitions,
            executeTool: executeErpTool,
            onDelta: onEvent ? (delta) => onEvent({ delta }) : null,
            maxIterations: 5
        });
    }
}

module.exports = FinanceAgent;
