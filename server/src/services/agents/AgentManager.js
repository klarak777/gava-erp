const SupervisorAgent = require('./SupervisorAgent');
const LegalAgent = require('./LegalAgent');
const FinanceAgent = require('./FinanceAgent');
const ErpDataAgent = require('./ErpDataAgent');

// Egyszerű köszönések / smalltalk felismerése LLM-hívás nélkül
const GREETING_RE = /^(szia|sziasztok|helló|hello|hi|jó\s?napot( kívánok)?|jó reggelt|jó estét|üdv(özöllek|özlet)?|köszönöm|kösz(önjük)?|köszi|ok(é|s)?|rendben|viszlát|szép napot)[!.\s]*$/i;

const GREETING_ANSWER = 'Szia! A GAVA MI Asszisztens vagyok. Kérdezz bátran általános, jogi vagy pénzügyi témában, vagy tölts fel egy dokumentumot (PDF, DOCX, CSV, XLSX) az elemzéséhez.';

class AgentManager {
    constructor(openai) {
        this.openai = openai;
        this.supervisor = new SupervisorAgent(openai);
        this.legalAgent = new LegalAgent(openai);
        this.financeAgent = new FinanceAgent(openai);
        this.erpDataAgent = new ErpDataAgent(openai);
    }

    /**
     * Processes a chat request by first routing it through the Supervisor,
     * then forwarding it to the appropriate division.
     *
     * @param {number|null} documentId
     * @param {string} message
     * @param {string|null} documentCategory
     * @param {Array} history - korábbi üzenetek [{role, content}]
     * @param {Array|null} uiContext - UI state context
     * @param {function|null} onEvent - streaming callback (szövegrészletek)
     */
    async handleChat(documentId, message, documentCategory = null, history = [], uiContext = null, onEvent = null) {
        const trimmed = (message || '').trim();

        // Step 0: Köszönés / smalltalk short-circuit – azonnali válasz, LLM nélkül
        if (!documentId && trimmed.length <= 40 && GREETING_RE.test(trimmed)) {
            if (onEvent) onEvent({ delta: GREETING_ANSWER });
            return GREETING_ANSWER;
        }

        // Step 1: Supervisor Analysis
        let routingDecision;
        try {
            routingDecision = await this.supervisor.analyzeAndRoute(message, documentCategory, history);
        } catch (error) {
            // Ne nyeljük el a hibát: router kiesése esetén közvetlenül a fő modellel válaszolunk
            console.error('Supervisor Routing Error:', error);
            routingDecision = { route: documentCategory === 'legal' ? 'legal' : documentCategory === 'finance' ? 'finance' : 'direct' };
        }

        // Step 2: Route to appropriate agent
        if (routingDecision.route === 'legal') {
            return await this.legalAgent.process(message, documentId, history, onEvent);
        }

        if (routingDecision.route === 'finance') {
            return await this.financeAgent.process(message, documentId, history, onEvent);
        }

        if (routingDecision.route === 'erp') {
            return await this.erpDataAgent.process(message, documentId, history, uiContext, onEvent);
        }

        if (routingDecision.route === 'both') {
            // Párhuzamos futtatás; streamingnél pufferekbe gyűjtünk,
            // hogy a két divízió szövege ne keveredjen össze
            const [legalRes, finRes] = await Promise.all([
                this.legalAgent.process(message, documentId, history, null),
                this.financeAgent.process(message, documentId, history, null)
            ]);
            const response = `**Jogi Divízió véleménye:**\n${legalRes}\n\n---\n\n**Pénzügyi Divízió véleménye:**\n${finRes}`;
            if (onEvent) onEvent({ delta: response });
            return response;
        }

        if (routingDecision.route === 'direct') {
            // Router hiba esetére: általános válasz közvetlenül a fő modellel
            return await this.directAnswer(message, history, onEvent);
        }

        // self
        const selfAnswer = routingDecision.selfAnswer || 'Sajnos nem tudtam értelmezni a kérést. Kérem pontosítson.';
        if (onEvent) onEvent({ delta: selfAnswer });
        return selfAnswer;
    }

    /**
     * Fallback általános válasz, ha a supervisor routing hibát dobott.
     */
    async directAnswer(message, history = [], onEvent = null) {
        const messages = [
            {
                role: 'system',
                content: 'A GAVA Hungária Kft. vállalatirányítási asszisztense vagy. Válaszolj udvariasan, tömören, magyarul. Ha a kérdés jogi vagy pénzügyi szakértelmet igényel, jelezd, hogy pontosabb választ a divíziós modul tud adni.'
            }
        ];
        for (const h of history.slice(-10)) {
            if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
                messages.push({ role: h.role, content: String(h.content).slice(0, 2000) });
            }
        }
        messages.push({ role: 'user', content: message });

        if (onEvent) {
            const stream = await this.openai.chat.completions.create({
                model: process.env.AI_CHAT_MODEL || 'gpt-5.5',
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

        const response = await this.openai.chat.completions.create({
            model: process.env.AI_CHAT_MODEL || 'gpt-5.5',
            messages
        });
        return response.choices[0].message.content;
    }
}

module.exports = AgentManager;
