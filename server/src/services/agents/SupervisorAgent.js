// A routinghoz kis, gyors modellt használunk – a nagy reasoning modell
// feleslegesen lassítaná az egyszerű kérdéseket is.
const ROUTER_MODEL = process.env.AI_ROUTER_MODEL || 'gpt-4o-mini';

// Reasoning modelleknél alacsony erőfeszítésre állítjuk a routert,
// más modelleknél ezt a paramétert nem küldjük (400-as hibát okozna).
function supportsReasoningEffort(model) {
    return /^(gpt-5|o\d)/i.test(model);
}

class SupervisorAgent {
    constructor(openai) {
        this.openai = openai;
    }

    async analyzeAndRoute(message, documentCategory = null, history = []) {
        const systemPrompt = `A GAVA Hungária Kft. vállalatirányítási asszisztense vagy. Feladatod, hogy a kollégák kérdéseire udvariasan, segítőkészen és tömören válaszolj. Minden beérkező kérdést és a hozzá feltöltött dokumentumokat elemezd, majd döntsd el, hogy tartalmaznak-e pénzügyi, számviteli vagy jogi témájú kérdéseket.

- Ha a kérdés vagy a dokumentum jogi témájú, a válasz generálását add át a Jogi divíziónak.
- Ha a kérdés vagy a dokumentum pénzügyi vagy számviteli témájú, a válasz generálását add át a Pénzügyi és Számviteli divíziónak.
- Ha a kérdés az ERP adatbázis üzleti adataira kérdez rá (partnerek, fuvarok, kamionok, szállítók, termékek, szezonok, fuvar pénzügyi adatok), VAGY arra, hogy JELENLEG MILYEN ABLAK/OLDAL VAN NYITVA a felületen, VAGY arra, hogy képes vagy-e elérni az adatbázist / látod-e a felületet, akkor route: erp – az ERP adatasszisztens megkapja a felület állapotát és adatbázis-lekérdezéssel válaszol.
- KIVÉTEL: ha a kérdés kifejezetten pénzügyi ELEMZÉST vagy összehasonlítást kér feltöltött dokumentumon vagy adatbázis-adatokon (pl. fedezet, önköltség, trend, kiugró érték vizsgálata), az marad finance.
- Ha egyik kategóriába sem tartozik, a kérdésre saját magad válaszolj a rendelkezésedre álló információk alapján.
- Ha a kérdés általános jellegű (pl. köszönés, smalltalk, általános tudást igénylő kérdés), akkor route: self – ilyenkor NE vedd figyelembe a feltöltött dokumentum típusát.

Ha egy kérdés több kategóriát is érint (például jogi és pénzügyi), akkor azt mindkét érintett divíziónak add át. Ne találj ki információkat; ha valami nem egyértelmű, jelezd, hogy további információ szükséges.

Formátum (KIZÁRÓLAG EZT A JSON-t ADD VISSZA, backtickek nélkül):
{
  "route": "legal" | "finance" | "both" | "erp" | "self",
  "selfAnswer": "Ha a route 'self', akkor itt írd le a válaszod, különben hagyd üresen."
}`;

        const messages = [{ role: 'system', content: systemPrompt }];
        // Korábbi üzenetek, hogy a follow-up kérdések is értelmezhetők legyenek
        for (const h of history.slice(-10)) {
            if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
                messages.push({ role: h.role, content: String(h.content).slice(0, 2000) });
            }
        }
        messages.push({
            role: 'user',
            content: `Feltöltött dokumentum típusa: ${documentCategory || 'nincs'}\nKérdés: ${message}`
        });

        const params = {
            model: ROUTER_MODEL,
            messages,
            response_format: { type: "json_object" }
        };
        if (supportsReasoningEffort(ROUTER_MODEL)) {
            params.reasoning_effort = 'low';
        }

        const response = await this.openai.chat.completions.create(params);
        const content = response.choices[0].message.content;
        return JSON.parse(content);
    }
}

module.exports = SupervisorAgent;
