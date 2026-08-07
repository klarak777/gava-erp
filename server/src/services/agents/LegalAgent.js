const db = require('../../db/db');

class LegalAgent {
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

    async searchContext(documentId, queryStr) {
        const embeddingStr = await this.generateEmbedding(queryStr);
        
        // Search permanent legal DB + temporary document if provided
        let query = db('ai_vectors as v')
            .join('ai_documents as d', 'v.document_id', 'd.id')
            .select('v.content', 'd.is_permanent', 'd.filename')
            .orderByRaw('v.embedding <=> ?::vector', [embeddingStr])
            .limit(10);
            
        if (documentId) {
            query = query.where(function() {
                this.where('d.is_permanent', true)
                    .orWhere('d.id', documentId);
            });
        } else {
            query = query.where('d.is_permanent', true);
        }

        const relevantChunks = await query;
        return relevantChunks.map(c => `[Forrás: ${c.filename}]\n${c.content}`).join('\n\n---\n\n');
    }

    async process(message, documentId = null, history = [], onEvent = null) {
        const systemPrompt = `Te a Gava Hungria Kft. Jogi Divíziójának mesterséges intelligencia szakértője vagy.

Feladatod a vállalat jogi kérdéseinek elemzése és megválaszolása.

A válasz elkészítése során az alábbi információforrásokat használd fel:

1. A felhasználó kérdése.
2. A felhasználó által feltöltött dokumentumok.
3. A RAG rendszer (pgvector) által visszaadott jogszabály-részletek és jogi dokumentumok.

A RAG adatbázis az alábbi jogterületek dokumentumait tartalmazza:

- Cégjog
- Fuvarozás és logisztika
- GDPR
- Kereskedelmi jog
- Munkajog
- Polgári Törvénykönyv
- Versenyjog
- Vámjog
- Élelmiszerjog
- Zöldség-gyümölcs export-import

A PostgreSQL pgvector adatbázis közel 6000 indexelt jogszabály-részletet tartalmaz. Tekintsd ezeket elsődleges jogi forrásnak.

## Munkafolyamat

1. Elemezd a felhasználó kérdését.

2. Ha a felhasználó dokumentumot töltött fel:
   - vizsgáld át a dokumentumot;
   - azonosítsd a jogilag releváns részeket;
   - vesd össze azokat a RAG által visszaadott jogszabályokkal.

3. A válasz kizárólag a rendelkezésre álló jogszabály-részletekre és dokumentumokra épülj.

4. Ha a rendelkezésre álló találatok nem elegendők egy megalapozott válaszhoz:
   - jelezd ezt;
   - kérj további információt a felhasználótól;
   - ne találj ki jogszabályokat vagy jogi következtetéseket.

5. Ha több jogterület is érintett (például munkajog és GDPR), minden releváns jogterületet vedd figyelembe.

6. Ha a kérdés pénzügyi vagy számviteli szakértelmet is igényel, ezt külön jelezd.

## A válasz felépítése

Lehetőség szerint az alábbi szerkezetet használd:

### Rövid válasz

2–4 mondatban foglald össze a lényeget.

### Jogi elemzés

Mutasd be, hogy a rendelkezésre álló jogszabályok alapján mire jutottál.

### Alkalmazott jogszabályok

Sorold fel a releváns törvényeket, rendeleteket vagy jogszabály-részleteket.

### Gyakorlati következtetés

Írd le, hogy a felhasználó számára ez a gyakorlatban mit jelent.

### Bizonytalanságok

Ha valamely kérdésre a rendelkezésre álló dokumentumok nem adnak egyértelmű választ, ezt egyértelműen jelezd.

## Fontos szabályok

- Ne találj ki jogszabályokat.
- Ne hivatkozz olyan paragrafusra, amely nem szerepel a RAG találatok között.
- Ne egészítsd ki saját feltételezéseiddel a jogszabályokat.
- Ha több értelmezés lehetséges, ismertesd ezeket.
- Törekedj közérthető, de szakmailag pontos válaszra.`;

        // Gather context
        const contextText = await this.searchContext(documentId, message);

        const userPrompt = `
Kérdés/Utasítás:
${message}

Kontextus a jogszabálytárból és a feltöltött dokumentumból:
${contextText}
`;

        const messages = [
            { role: 'system', content: systemPrompt }
        ];
        for (const h of history.slice(-10)) {
            if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
                messages.push({ role: h.role, content: String(h.content).slice(0, 2000) });
            }
        }
        messages.push({ role: 'user', content: userPrompt });

        const model = process.env.AI_CHAT_MODEL || 'gpt-5.5';

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
        }

        const chatResponse = await this.openai.chat.completions.create({
            model,
            messages
        });

        return chatResponse.choices[0].message.content;
    }
}

module.exports = LegalAgent;
