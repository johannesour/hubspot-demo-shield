const CATS = [
  ['names', 'Namen'],
  ['emails', 'E-Mails'],
  ['phones', 'Telefon'],
  ['addresses', 'Adressen'],
  ['companies', 'Firmen & Deals'],
  ['domains', 'Domains & URLs'],
  ['amounts', 'Beträge & IBAN'],
  ['freetext', 'Notizen & Freitext'],
  ['personal', 'Geburtstag & Nummern'],
  ['owners', 'Eigene Mitarbeiter']
];
const GEN_LABEL = { blur: 'unscharf', text: 'Freitext', person: 'Name', company: 'Firma', address: 'Adresse', amount: 'Betrag' };
const $ = (id) => document.getElementById(id);
let S;

async function load() {
  S = HDS.withDefaults(await chrome.storage.local.get(null));
  if (!S.seed) await save({ seed: HDS.randomSeed() });
  render();
}
async function save(patch) {
  Object.assign(S, patch);
  await chrome.storage.local.set(patch);
}

function render() {
  $('enabled').checked = S.enabled;
  $('status').textContent = S.enabled ? 'Aktiv – Daten werden anonymisiert' : 'Aus';
  $('status').classList.toggle('on', S.enabled);
  document.querySelectorAll('input[name=mode]').forEach((r) => (r.checked = r.value === S.mode));
  $('categories').innerHTML = '';
  for (const [key, label] of CATS) {
    const l = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!S.categories[key];
    cb.addEventListener('change', () => save({ categories: { ...S.categories, [key]: cb.checked } }));
    l.append(cb, label);
    $('categories').append(l);
  }
  if (document.activeElement !== $('exceptions')) $('exceptions').value = S.exceptions.join('\n');
  $('rules').innerHTML = '';
  S.customRules.forEach((r, i) => {
    const li = document.createElement('li');
    const code = document.createElement('code');
    code.textContent = r.selector;
    code.title = r.selector;
    const gen = document.createElement('span');
    gen.className = 'gen';
    gen.textContent = GEN_LABEL[r.gen] || r.gen;
    const del = document.createElement('button');
    del.textContent = '×';
    del.title = 'Regel löschen';
    del.addEventListener('click', () => {
      const customRules = S.customRules.filter((_, j) => j !== i);
      save({ customRules }).then(render);
    });
    li.append(code, gen, del);
    $('rules').append(li);
  });
}

$('enabled').addEventListener('change', (e) => save({ enabled: e.target.checked }).then(render));
document.querySelectorAll('input[name=mode]').forEach((r) =>
  r.addEventListener('change', () => save({ mode: r.value }))
);
let exTimer;
$('exceptions').addEventListener('input', (e) => {
  clearTimeout(exTimer);
  exTimer = setTimeout(() => save({ exceptions: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }), 400);
});
$('reseed').addEventListener('click', () => save({ seed: HDS.randomSeed() }));
$('pick').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'hds-pick', gen: $('pickGen').value });
    window.close();
  } catch {
    $('pick').textContent = 'Nur auf HubSpot';
    setTimeout(() => ($('pick').textContent = 'Auf Seite wählen'), 2000);
  }
});
chrome.storage.onChanged.addListener(() => load());
load();
