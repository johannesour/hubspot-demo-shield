// Deterministische Fake-Daten: gleicher Originalwert + gleicher Seed
// ⇒ überall derselbe Ersatzwert. Keine Zufallswerte, keine Netzwerkzugriffe.
(() => {
  const HDS = (self.HDS = self.HDS || {});

  const FIRST = ['Lena', 'Jonas', 'Mia', 'Felix', 'Sophie', 'Lukas', 'Emma', 'Paul', 'Hannah', 'Leon',
    'Clara', 'Noah', 'Marie', 'Elias', 'Lea', 'Finn', 'Anna', 'Ben', 'Laura', 'Tim', 'Sara', 'David',
    'Julia', 'Moritz', 'Nina', 'Jan', 'Lisa', 'Tobias', 'Katharina', 'Simon', 'Amelie', 'Niklas',
    'Aylin', 'Mehmet', 'Zoe', 'Luca', 'Elif', 'Daniel', 'Johanna', 'Oskar'];
  const LAST = ['Berger', 'Hoffmann', 'Krause', 'Lindner', 'Vogel', 'Brandt', 'Kaiser', 'Seidel',
    'Winter', 'Lorenz', 'Hartmann', 'Kühn', 'Engel', 'Busch', 'Roth', 'Frank', 'Graf', 'Jäger',
    'Sommer', 'Haas', 'Arnold', 'Pohl', 'Ludwig', 'Kraft', 'Beck', 'Lang', 'Kraus', 'Albrecht',
    'Franke', 'Schulze', 'Böhm', 'Keller', 'Weiß', 'Brenner', 'Ahrens', 'Yilmaz', 'Kaya', 'Novak',
    'Marino', 'Petersen'];
  const STEMS = ['Nordlicht', 'Alpenwerk', 'Rheinblick', 'Sonnenfeld', 'Lindengrund', 'Weitblick',
    'Silberbach', 'Brückenbau', 'Taunus', 'Elbwerk', 'Kranich', 'Falkenstein', 'Morgenrot', 'Seeblick',
    'Waldhaus', 'Feldmark', 'Sternwarte', 'Blauwal', 'Eichenhof', 'Talstation', 'Hafenkante',
    'Kompass', 'Leuchtturm', 'Bergwind', 'Quellwerk', 'Zugvogel', 'Grünfeld', 'Uferweg',
    'Wolkenreich', 'Mühlbach'];
  const TYPES = ['Consulting', 'Systems', 'Logistik', 'Software', 'Maschinenbau', 'Solutions',
    'Digital', 'Engineering', 'Handel', 'Technik', 'Medien', 'Partners', 'Analytics', 'Energie',
    'Services'];
  const LEGAL_DEFAULT = ['GmbH', 'GmbH', 'GmbH', 'AG', 'GmbH & Co. KG', 'SE'];
  const STREETS = ['Lindenstraße', 'Hauptstraße', 'Gartenweg', 'Bahnhofstraße', 'Am Markt',
    'Schillerstraße', 'Bergstraße', 'Rosenweg', 'Kirchplatz', 'Mühlenweg', 'Parkallee', 'Talstraße',
    'Goethestraße', 'Uferstraße', 'Am Hang', 'Wiesenweg'];
  const CITIES = [['10115', 'Berlin'], ['20095', 'Hamburg'], ['80331', 'München'], ['50667', 'Köln'],
    ['60311', 'Frankfurt am Main'], ['70173', 'Stuttgart'], ['40213', 'Düsseldorf'], ['04109', 'Leipzig'],
    ['28195', 'Bremen'], ['01067', 'Dresden'], ['90402', 'Nürnberg'], ['30159', 'Hannover'],
    ['68159', 'Mannheim'], ['79098', 'Freiburg'], ['24103', 'Kiel'], ['93047', 'Regensburg']];
  const DEAL_SUFFIX = ['Lizenzerweiterung', 'Rollout 2027', 'Pilotprojekt', 'Rahmenvertrag',
    'Upgrade Enterprise', 'Neukunde', 'Wartungsvertrag', 'Beratungspaket', 'Onboarding', 'Verlängerung'];
  const WORDS = ['Abstimmung', 'zum', 'Termin', 'Angebot', 'Rückmeldung', 'Projekt', 'nächste',
    'Schritte', 'besprochen', 'Unterlagen', 'Anforderungen', 'Zeitplan', 'Budget', 'vereinbart',
    'Präsentation', 'Feedback', 'offen', 'geklärt', 'Workshop', 'Freigabe', 'Vertrag', 'Entwurf',
    'folgt', 'kurz', 'Status', 'Woche', 'Team', 'Prüfung', 'Einführung', 'Umsetzung', 'und', 'mit',
    'für', 'im', 'nach', 'bis', 'gemeinsam', 'intern', 'Anfang', 'Ende'];
  const FREEMAIL = new Set(['gmail.com', 'googlemail.com', 'web.de', 'gmx.de', 'gmx.net', 'gmx.at',
    'outlook.com', 'outlook.de', 'hotmail.com', 'hotmail.de', 'yahoo.com', 'yahoo.de', 'icloud.com',
    't-online.de', 'mail.de', 'posteo.de', 'proton.me', 'protonmail.com', 'live.de', 'live.com']);
  const SOCIAL = /(^|\.)(linkedin\.com|xing\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|github\.com)$/i;
  const LEGAL = /(?:,?\s+)(GmbH\s*&\s*Co\.?\s*KG|gGmbH|GmbH|AG|SE|KGaA|KG|OHG|UG(?:\s*\(haftungsbeschränkt\))?|e\.\s?V\.|Inc\.?|Ltd\.?|LLC|Corp\.?|S\.A\.|B\.V\.|S\.r\.l\.|AB|Oy|PLC|Co\.)\s*$/i;

  let seed = 'hds';
  const fakeValues = new Set(); // erzeugte Fake-Strings (damit nichts doppelt ersetzt wird)

  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
    return h >>> 0;
  }
  const H = (kind, key) => hash(seed + '|' + kind + '|' + key);
  const pick = (list, kind, key) => list[H(kind, key) % list.length];
  const norm = (s) =>
    s.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]/g, '');
  const slug = (s) =>
    s.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const keep = (v) => (fakeValues.add(v), v);

  // Leading/trailing Whitespace des Originals erhalten
  const wrap = (fn) => (text, ...args) => {
    const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2]) return text;
    return m[1] + fn(m[2], ...args) + m[3];
  };

  const firstName = (w) => pick(FIRST, 'first', norm(w));
  const lastName = (w) => pick(LAST, 'last', norm(w));
  const PARTICLE = /^(von|van|de|der|den|zu|zur|di|da|du|le|la|al|el|bin)$/i;
  const TITLE = /^(dr\.?|prof\.?|dipl\.?-?\w*\.?|herr|frau|mr\.?|mrs\.?|ms\.?)$/i;

  function person(text, mode = 'person') {
    const t = text.replace(/\s+/g, ' ');
    if (mode === 'firstname') return keep(t.split(' ').map(firstName).join(' '));
    if (mode === 'lastname') return keep(t.split(' ').map((w) => (PARTICLE.test(w) ? w : lastName(w))).join(' '));
    if (t.includes('@')) return email(t);
    if (/,/.test(t)) {
      const [l, f] = t.split(',').map((s) => s.trim());
      return keep(person(l, 'lastname') + (f ? ', ' + person(f, 'firstname') : ''));
    }
    const words = t.split(' ');
    let firstDone = false;
    const out = words.map((w, i) => {
      if (TITLE.test(w) || PARTICLE.test(w)) return w;
      if (!firstDone && (words.length === 1 || i < words.length - 1)) {
        firstDone = true;
        return firstName(w);
      }
      return lastName(w);
    });
    return keep(out.join(' '));
  }

  function companyParts(text) {
    const t = text.trim();
    const m = t.match(LEGAL);
    const stem = m ? t.slice(0, m.index).trim() : t;
    return { stem, legal: m ? m[1] : '' };
  }
  function companyBase(key) {
    const h = H('co', key);
    return STEMS[h % STEMS.length] + ' ' + TYPES[(h >>> 8) % TYPES.length];
  }
  function company(text) {
    const { stem, legal } = companyParts(text);
    // Schlüssel = erstes markantes Wort → "Bosch", "Robert Bosch GmbH" und bosch.de bleiben konsistent
    const key = norm(stem.split(/\s+/).filter((w) => w.length > 2).pop() || stem);
    const base = companyBase(key);
    return keep(legal ? `${base} ${legal}` : base);
  }
  function deal(text) {
    // Ganzer Name als Schlüssel: Deals mit gleichem Präfix ("Mitgliedschaft – …") sollen
    // trotzdem unterschiedlich aussehen
    const co = companyBase(norm(text));
    return keep(`${co} – ${pick(DEAL_SUFFIX, 'deal', norm(text))}`);
  }

  function domain(host) {
    const d = host.toLowerCase().replace(/^www\./, '');
    if (FREEMAIL.has(d) || HDS.SAFE_HOSTS.test(d) || fakeValues.has(d)) return host;
    if (SOCIAL.test(d)) return host;
    const labels = d.split('.');
    const tld = labels.pop();
    const key = norm(labels.pop() || d);
    const out = slug(companyBase(key)) + '.' + (['de', 'com', 'io', 'eu', 'at', 'ch'].includes(tld) ? tld : 'de');
    fakeValues.add(out);
    return (host.match(/^www\./i) ? 'www.' : '') + out;
  }

  function url(full, host, path) {
    const d = host.toLowerCase().replace(/^www\./, '');
    if (HDS.SAFE_HOSTS.test(d) || fakeValues.has(d)) return full;
    let out = full.replace(host, domain(host));
    if (path && path.length > 1) {
      if (SOCIAL.test(d)) {
        const p = path.replace(/[^/]+\/?$/, (seg) => slug(person(seg.replace(/[-_/]/g, ' '))) + (seg.endsWith('/') ? '/' : ''));
        out = out.replace(path, p);
      }
    }
    return keep(out);
  }

  function email(addr) {
    if (fakeValues.has(addr)) return addr;
    const [local, dom = ''] = addr.split('@');
    const fakeDom = dom ? domain(dom) : '';
    const parts = local.split(/[._\-+]/).filter(Boolean);
    let fl;
    if (parts.length >= 2 && /^[a-zäöüß]+$/i.test(parts[0])) {
      fl = `${firstName(parts[0])}.${lastName(parts[parts.length - 1])}`;
    } else if (/^(info|kontakt|contact|sales|vertrieb|office|hello|hallo|support|service|mail|team|buchhaltung|rechnung|invoice|billing|jobs|karriere|presse|press|marketing|noreply|no-reply)$/i.test(local)) {
      fl = local;
    } else {
      fl = `${pick(FIRST, 'first', norm(local))}.${pick(LAST, 'last', norm(local))}`;
    }
    return keep(`${slug(fl).replace(/-/g, '.')}@${fakeDom}`);
  }

  function phone(text) {
    const m = text.match(/^(\s*(?:\+\d{1,3}|00\d{1,3}|0)[\s\-/()]*\d{1,2})/);
    const prefix = m ? m[1] : '';
    let i = 0;
    const rest = text.slice(prefix.length).replace(/\d/g, () => String(H('ph', norm(text) + i++) % 10));
    return keep(prefix + rest);
  }

  function parseNum(str) {
    const m = str.match(/^(.*?)([.,])(\d{1,2})$/);
    let intPart = str;
    let dec = '';
    let decSep = '';
    if (m && /[.,\s  ]/.test(m[1]) === false && m[2] === '.' && m[3].length === 2) {
      // "1.50" → Dezimalpunkt
      intPart = m[1]; dec = m[3]; decSep = '.';
    } else if (m) {
      intPart = m[1]; dec = m[3]; decSep = m[2];
    }
    const t = intPart.match(/[.,   ]/);
    const digits = intPart.replace(/\D/g, '');
    if (!digits) return null;
    return { value: parseFloat(digits + (dec ? '.' + dec : '')), thouSep: t ? t[0] : '', decSep, decimals: dec.length };
  }
  function formatNum(v, f) {
    const fixed = v.toFixed(f.decimals);
    let [i, d] = fixed.split('.');
    if (f.thouSep) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, f.thouSep);
    return d ? i + (f.decSep || ',') + d : i;
  }
  function amount(text) {
    const out = text.replace(/\d[\d.,   ]*\d|\d/, (num) => {
      const f = parseNum(num.trim());
      if (!f) return num;
      const factor = 0.35 + (H('amt', norm(text)) % 130) / 100;
      let v = f.value * factor;
      if (v >= 100) {
        const mag = Math.pow(10, Math.floor(Math.log10(v)) - 1);
        v = Math.round(v / mag) * mag;
      } else if (f.decimals === 0) v = Math.max(1, Math.round(v));
      return formatNum(v, f) + (num.match(/\s+$/) || [''])[0];
    });
    return keep(out);
  }

  function address(text) {
    const t = text.trim();
    let ci = H('city', norm(t)) % CITIES.length;
    if (t.includes(CITIES[ci][0]) || t.includes(CITIES[ci][1])) ci = (ci + 1) % CITIES.length;
    const city = CITIES[ci];
    const street = () => `${pick(STREETS, 'street', norm(t))} ${(H('hn', norm(t)) % 120) + 1}`;
    if (/^\d{4,5}$/.test(t)) return keep(city[0]);
    if (/,/.test(t) || /\d{5}\s+\D/.test(t)) return keep(`${street()}, ${city[0]} ${city[1]}`);
    if (/\d/.test(t)) return keep(street());
    return keep(city[1]);
  }

  function freetext(text) {
    const len = text.trim().length;
    const words = [];
    let n = 0;
    let i = 0;
    while (n < len) {
      const w = WORDS[H('lorem', norm(text).slice(0, 40) + i) % WORDS.length];
      words.push(w);
      n += w.length + 1;
      i++;
      if (i > 400) break;
    }
    let s = words.join(' ');
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (/[.!?…]$/.test(text.trim()) || len > 40) s += '.';
    return keep(s);
  }

  // Datum: Format behalten, Werte ersetzen (Jahr 1965–1999 bei Geburtsdaten plausibel)
  function fakeDate(text) {
    const key = norm(text);
    const isoLike = /^\s*\d{4}\D/.test(text);
    let k = 0;
    return keep(text.replace(/\d+/g, (num) => {
      const h = H('date' + k++, key);
      if (num.length === 4) return String(1965 + (h % 35));
      const v = isoLike || k === 2 ? (h % 12) + 1 : (h % 28) + 1;
      return String(v).padStart(num.length, '0');
    }));
  }
  // IDs/Nummern: Ziffern und Buchstaben ersetzen, Format behalten
  function fakeNumber(text) {
    const key = norm(text);
    let i = 0;
    return keep(text.replace(/[0-9A-Za-z]/g, (c) => {
      const h = H('num' + i++, key);
      if (/\d/.test(c)) return String(h % 10);
      const l = String.fromCharCode(97 + (h % 26));
      return c === c.toUpperCase() ? l.toUpperCase() : l;
    }));
  }

  const GEN = {
    person: (t) => person(t, 'person'),
    firstname: (t) => person(t, 'firstname'),
    lastname: (t) => person(t, 'lastname'),
    email: (t) => t.replace(HDS.RE.email, email),
    phone,
    address,
    company,
    deal,
    domain: (t) => (HDS.RE.url.test(t) ? t.replace(HDS.RE.url, url) : company(t)),
    amount,
    text: freetext,
    owner: (t) => (HDS.PLACEHOLDER.test(t) ? t : person(t, 'person')),
    date: fakeDate,
    number: fakeNumber,
    initials: (t) => keep(t.length <= 1 ? firstName(t)[0] : firstName(t)[0] + lastName(t)[0])
  };

  HDS.faker = {
    setSeed(s) { seed = String(s || 'hds'); fakeValues.clear(); },
    isFake: (s) => fakeValues.has(s),
    gen(kind, text) {
      HDS.RE.url.lastIndex = 0;
      const fn = GEN[kind];
      return fn ? wrap(fn)(text) : text;
    },
    email, url, phone, amount, person, company, companyParts,
    hash
  };
})();
