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

    isLegalRegulationNeeded(queryStr, hasUploadedDocs) {
        if (!hasUploadedDocs) return true;
        if (!queryStr) return false;
        const q = queryStr.toLowerCase();
        const legalKeywords = [
            'jogszabály', 'törvény', 'rendelet', 'jog', 'megfelelőség', 'compliance',
            'érvényesség', 'jogilag', 'tiltott', 'kötelező', 'szabályzat', 'kötbér',
            'bánatpénz', 'felmondás', 'hatály', 'pfe', 'ptk', 'vet', 'bekezdés', 'paragrafus'
        ];
        return legalKeywords.some(kw => q.includes(kw));
    }

    async searchContext(documentId, queryStr, documentIds = []) {
        const docIds = Array.isArray(documentIds) && documentIds.length
            ? documentIds.map(Number).filter(Boolean)
            : (documentId ? [Number(documentId)] : []);

        const embeddingStr = await this.generateEmbedding(queryStr);
        const sections = [];

        // 1. Ha van feltöltött dokumentum: ELSŐDLEGESEN a feltöltött dokumentumokból gyűjtjük ki a chunkokat!
        if (docIds.length > 0) {
            const uploadedChunks = await db('ai_vectors as v')
                .join('ai_documents as d', 'v.document_id', 'd.id')
                .whereIn('v.document_id', docIds)
                .select('v.content', 'd.filename', 'd.id as doc_id')
                .orderByRaw('v.embedding <=> ?::vector', [embeddingStr])
                .limit(20);

            if (uploadedChunks.length > 0) {
                const docText = uploadedChunks
                    .map(c => `[Feltöltött dokumentum: ${c.filename}]\n${c.content}`)
                    .join('\n\n---\n\n');
                sections.push(`### Feltöltött dokumentum(ok) releváns tartalma (ELSŐDLEGES TÉNYBELI FORRÁS):\n${docText}`);
            }
        }

        // 2. Jogi vektor adatbázis (állandó jogszabálytár):
        // Csak akkor és csak azokra a jogi szempontokra alkalmazzuk a 6000 jogszabályt,
        // ha a kérdés kifejezetten jogszabályi megfelelőségre, törvényre kérdez rá, vagy nincs feltöltött fájl.
        const needsPermanentLegal = this.isLegalRegulationNeeded(queryStr, docIds.length > 0);
        if (needsPermanentLegal) {
            const legalChunks = await db('ai_vectors as v')
                .join('ai_documents as d', 'v.document_id', 'd.id')
                .where('d.is_permanent', true)
                .select('v.content', 'd.filename')
                .orderByRaw('v.embedding <=> ?::vector', [embeddingStr])
                .limit(docIds.length > 0 ? 5 : 10);

            if (legalChunks.length > 0) {
                const legalText = legalChunks
                    .map(c => `[Jogszabálytár: ${c.filename}]\n${c.content}`)
                    .join('\n\n---\n\n');
                sections.push(`### Kapcsolódó jogszabályi háttér a jogszabálytárból (másodlagos referencia jogi szempontokhoz):\n${legalText}`);
            }
        }

        return sections.join('\n\n========================================\n\n');
    }

    async process(message, documentId = null, history = [], onEvent = null, documentIds = []) {
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

- Ha a felhasználó dokumentumo(ka)t töltött fel, a feltöltött dokumentumok képezik az ELSŐDLEGES, hiteles és közvetlen forrást a tényekre, árakra, ajánlatokra, díjakra és szerződéses feltételekre nézve!
- A jogszabálytárat (törvények, rendeletek) KIZÁRÓLAG akkor és arra használd, ha a kérdés jogi szempontból vizsgálja a dokumentumot (pl. jogszabályi megfelelőség, VET, Ptk., ÁSZF érvényesség, kötbér, felmondási jog).
- Soha ne keverd össze a jogszabálytár általános szövegeit (pl. vámtarifák, fuvarozási jogszabályok) a feltöltött konkrét szerződés vagy ajánlat adataival!
- Ha a feltöltött dokumentumban árak, táblázatok vagy képletek szerepelnek, azokat tekintsd irányadónak, és pontosan mutasd be őket az elemzésben!
- Ne találj ki jogszabályokat.
- Ne hivatkozz olyan paragrafusra, amely nem szerepel a RAG találatok között.
- Ne egészítsd ki saját feltételezéseiddel a jogszabályokat.
- Ha több értelmezés lehetséges, ismertesd ezeket.
- Törekedj közérthető, de szakmailag pontos válaszra.

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

Kontextus a feltöltött dokumentumból és a jogszabálytárból:
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

        const model = process.env.AI_CHAT_MODEL || 'gpt-6.1-sol';

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
