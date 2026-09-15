const days = { wed: 'Szerda', thu: 'Csütörtök', fri: 'Péntek', sat: 'Szombat', sun: 'Vasárnap', mon: 'Hétfő', tue: 'Kedd' };
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

export function profileStatus(values, profile) {
  let total = 0;
  for (const day of Object.keys(profile.defaults)) {
    const raw = values[day];
    const value = Number(raw);
    if (raw === '' || raw == null || !Number.isFinite(value) || value < 0 || value > 100 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) {
      return { valid: false, message: '0–100% közötti számok szükségesek, legfeljebb két tizedesjeggyel.' };
    }
    total += Math.round(value * 100);
  }
  return { valid: total === 10000, total: total / 100, message: total === 10000 ? '100% ✓' : `${(total / 100).toLocaleString('hu-HU')}% – 100% szükséges` };
}

export function renderRateTables(profiles, rates) {
  const cell = 'padding:8px;border:1px solid #e2e8f0;text-align:center;';
  return [...new Set(profiles.map(p => p.group))].map(group => `
    <section style="margin:18px 0;"><h3 style="font-size:15px;">${escape(group)}</h3>
    <div style="overflow:auto;"><table style="border-collapse:collapse;width:100%;font-size:12px;">
      <thead style="background:#f1f5f9;"><tr><th style="${cell}">Időszak</th>${Object.values(days).map(name => `<th style="${cell}">${name}</th>`).join('')}<th style="${cell}">Összesen</th></tr></thead>
      <tbody>${profiles.filter(p => p.group === group).map(profile => `<tr>
        <th scope="row" style="${cell}text-align:left;min-width:165px;">${escape(profile.label)}</th>
        ${Object.keys(days).map(day => `<td style="${cell}">${Object.hasOwn(profile.defaults, day)
          ? `<input type="number" min="0" max="100" step="0.01" required data-profile="${profile.id}" data-day="${day}" value="${escape(rates[profile.id]?.[day] ?? profile.defaults[day])}" aria-label="${escape(group + ', ' + profile.label + ', ' + days[day])}" style="width:62px;padding:6px;border:1px solid #94a3b8;border-radius:4px;"> %`
          : '<span style="color:#94a3b8;">—</span>'}</td>`).join('')}
        <td data-total="${profile.id}" style="${cell}min-width:130px;font-weight:600;" aria-live="polite"></td>
      </tr>`).join('')}</tbody>
    </table></div></section>`).join('');
}

export async function openCommitmentRatesEditor({ year, week, onSaved }) {
  if (document.querySelector('#commitment-rates-editor')) return;
  const overlay = document.createElement('div');
  overlay.id = 'commitment-rates-editor';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="rates-title" style="background:white;border-radius:12px;width:1150px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;">
    <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;"><h2 id="rates-title" style="margin:0;font-size:18px;">⚙ Beállítás – ${year} / KW${week}</h2>
      <p style="font-size:13px;margin-bottom:0;">A beállítás csak erre a hétre vonatkozik. Minden időszak összege külön 100% legyen. Mentés után a becslés és a készlet újraszámolódik; a tényleges rendelés nem változik.</p></div>
    <div data-body style="padding:0 20px;overflow:auto;">Betöltés…</div>
    <div style="padding:16px 20px;border-top:1px solid #e2e8f0;"><div data-error role="alert" style="color:#b91c1c;margin-bottom:10px;"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;"><button type="button" data-reset disabled>Alapértékek visszaállítása</button><button type="button" data-cancel>Mégse</button><button type="button" data-save disabled style="background:#0284c7;color:white;border:0;border-radius:6px;padding:9px 16px;">Mentés és újraszámítás</button></div>
    </div></div>`;
  document.body.appendChild(overlay);
  const previousFocus = document.activeElement;
  const body = overlay.querySelector('[data-body]'), errorBox = overlay.querySelector('[data-error]');
  const save = overlay.querySelector('[data-save]'), reset = overlay.querySelector('[data-reset]'), cancel = overlay.querySelector('[data-cancel]');
  let saving = false;
  const close = () => { if (!saving) { overlay.remove(); previousFocus?.focus(); } };
  cancel.addEventListener('click', close);
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      const controls = [...overlay.querySelectorAll('input,button')].filter(el => !el.disabled);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  cancel.focus();
  try {
    const response = await fetch(`/api/v1/aldi-weekly-commitments/${year}/${week}`);
    if (!response.ok) throw new Error('Nem sikerült betölteni a százalékokat.');
    const data = await response.json();
    if (!overlay.isConnected) return;
    if (!Array.isArray(data.rate_profiles) || !data.rate_profiles.length) throw new Error('A szerver még a korábbi verziót futtatja. A backend frissítése és az adatbázis-migráció futtatása szükséges. A már feltöltött Excelt nem kell újra feltölteni.');
    if (!data.commitment?.id) throw new Error('A kiválasztott héthez nincs mentett lekötés. Válassz egy korábban feltöltött hetet.');
    const profiles = data.rate_profiles;
    let version = data.rates_version;
    const readDraft = () => Object.fromEntries(profiles.map(profile => [profile.id,
      Object.fromEntries(Object.keys(profile.defaults).map(day => [day, body.querySelector(`[data-profile="${profile.id}"][data-day="${day}"]`).value]))
    ]));
    function validate() {
      const draft = readDraft();
      let valid = true;
      for (const profile of profiles) {
        const status = profileStatus(draft[profile.id], profile);
        const total = body.querySelector(`[data-total="${profile.id}"]`);
        total.textContent = status.message;
        total.style.color = status.valid ? '#15803d' : '#b91c1c';
        valid = valid && status.valid;
      }
      save.disabled = !valid || saving;
      save.style.opacity = save.disabled ? '.5' : '1';
      errorBox.textContent = valid ? '' : 'Nem menthető: minden időszaknak pontosan 100%-ot kell kiadnia.';
      return valid;
    }
    body.innerHTML = renderRateTables(profiles, data.rates);
    body.addEventListener('input', validate);
    reset.disabled = false;
    reset.addEventListener('click', () => {
      body.innerHTML = renderRateTables(profiles, {});
      validate();
    });
    validate();
    body.querySelector('input')?.focus();
    save.addEventListener('click', async () => {
      if (saving || !validate()) return;
      if (!window.confirm(`A módosított százalékok mentésével újraszámítjuk a ${year} / KW${week} hét becsléseit és számított készletét. A tényleges rendelések elsőbbsége megmarad, más hetek nem változnak. Jóváhagyod a mentést és az újraszámítást?`)) return;
      const rates = Object.fromEntries(Object.entries(readDraft()).map(([id, values]) => [id, Object.fromEntries(Object.entries(values).map(([day, value]) => [day, Number(value)]))]));
      saving = true;
      overlay.querySelectorAll('input,button').forEach(el => { el.disabled = true; });
      save.textContent = 'Mentés…';
      try {
        const res = await fetch(`/api/v1/aldi-weekly-commitments/${year}/${week}/rates`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rates, version }) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Sikertelen mentés.');
        version = result.version;
        onSaved({ year, week, rates: result.rates, version });
        saving = false;
        close();
      } catch (error) {
        saving = false;
        overlay.querySelectorAll('input,button').forEach(el => { el.disabled = false; });
        save.textContent = 'Mentés és újraszámítás';
        validate();
        errorBox.textContent = error.message;
      }
    });
  } catch (error) { if (overlay.isConnected) { body.textContent = ''; errorBox.textContent = error.message; } }
}
