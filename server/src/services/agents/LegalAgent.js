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
        // Ha dokumentumok vannak feltöltve, csak akkor vonjuk be a jogszabálytárat,
        // ha a felhasználó kifejezetten törvényre, rendeletre vagy jogszabályi cikkelyre kérdez rá:
        const explicitLawKeywords = [
            'jogszabály', 'törvény', 'rendelet', 'ptk', 'vet', 'paragrafus', '§',
            'jogszabályi megfelelőség', 'hatályos jogszabály'
        ];
        return explicitLawKeywords.some(kw => q.includes(kw));
    }

    async searchContext(documentId, queryStr, documentIds = []) {
        const docIds = Array.isArray(documentIds) && documentIds.length
            ? documentIds.map(Number).filter(Boolean)
            : (documentId ? [Number(documentId)] : []);

        const embeddingStr = await this.generateEmbedding(queryStr);
        const sections = [];

        // 1. Ha van feltöltött dokumentum: MINDEN feltöltött fájlból kiegyensúlyozottan kérünk le chunkokat!
        if (docIds.length > 0) {
            const perDocLimit = docIds.length === 1 ? 25 : Math.max(8, Math.floor(24 / docIds.length));
            const chunkPromises = docIds.map(dId => 
                db('ai_vectors as v')
                    .join('ai_documents as d', 'v.document_id', 'd.id')
                    .where('v.document_id', dId)
                    .select('v.content', 'd.filename', 'd.id as doc_id')
                    .orderByRaw('v.embedding <=> ?::vector', [embeddingStr])
                    .limit(perDocLimit)
            );
            const chunkResults = await Promise.all(chunkPromises);
            const uploadedChunks = chunkResults.flat();

            if (uploadedChunks.length > 0) {
                const docText = uploadedChunks
                    .map(c => `[Feltöltött forrás: ${c.filename}]\n${c.content}`)
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
        const systemPrompt = `Te a Gava Hungria Kft. Jogi és Szerződéses Elemző Divíziójának mesterséges intelligencia szakértője vagy.

Feladatod a vállalat jogi, szerződéses és ajánlati kérdéseinek alapos elemzése, megválaszolása és összehasonlítása.

A válasz elkészítése során a feltöltött dokumentumok képezik az ELSŐDLEGES, MEGHATÁROZÓ forrást.

## Munkafolyamat és szabályok
1. Ha a felhasználó feltöltött dokumentumokat vagy ajánlatokat vet össze:
   - Mindig a feltöltött dokumentumok konkrét tartalmára, adataira (árak, díjtételek, kondíciók, mennyiségek, időszakok, felmondási és egyéb jogi feltételek) támaszkodj!
   - Készíts tételes, világos összehasonlítást és értékelést a [Feltöltött forrás: ...] dokumentumok között, kiemelve az előnyöket és a kockázatokat.
   - Ne hárítsd el a választ arra hivatkozva, hogy pénzügyi vagy egyéb szakértő kell, hanem mutasd be a dokumentumokban szereplő konkrét adatokat és azok összehasonlítását!
2. Ha a kérdés jogi vizsgálatot is igényel (pl. kötbér, felmondási jog, ajánlati kötöttség, jogszabályi megfelelőség), azt pontosan foglald össze a szerződéses és jogi feltételek tükrében.
3. Soha ne találj ki adatokat, és a válaszod legyen lényegretörő, strukturált, szakmai.

Gyorsgombok (quick replies):
- Ha pontosításhoz információra van szükséged a felhasználótól, a válasz LEGUTOLSÓ sorában add meg az opciókat ilyen formában:
[QUICK_REPLIES: Első opció | Második opció | Harmadik opció | Egyéb / szabad kérdés]
- Az opciók legyenek tömörek (max 5 szó), kattintható válaszként megfogalmazva.`;

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
