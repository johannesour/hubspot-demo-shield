// Kern: findet sensible Textknoten/Elemente und ersetzt (Fake) oder verwischt (Blur) sie.
// Originale werden nur im Speicher gehalten, damit "Aus" alles sauber zurücksetzt.
(() => {
  const HDS = (self.HDS = self.HDS || {});
  const F = HDS.faker;

  let S = HDS.withDefaults({});
  let exceptions = [];
  let ruleList = []; // [{gen, selector}]
  let blurSelector = '';

  const origOf = new WeakMap();
  const fakeOf = new WeakMap();
  const touched = new Set();
  const titleOrig = new WeakMap();
  const titleFake = new WeakMap();
  const titled = new Set();

  // Gelernte Originale (Namen/Firmen) → Fake, damit sie auch im Fließtext ersetzt werden
  const dict = new Map();
  let dictRe = null;
  let dictDirty = false;
  let onDictGrow = () => {};

  const BLUR = 'hds-blur';

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const catOn = (gen) => {
    const c = HDS.GEN_CATEGORY[gen];
    return c === null || c === undefined ? gen === 'blur' : !!S.categories[c];
  };
  const hasException = (s) => {
    if (!exceptions.length) return false;
    const l = s.toLowerCase();
    return exceptions.some((e) => l.includes(e));
  };

  function configure(settings) {
    S = HDS.withDefaults(settings);
    F.setSeed(S.seed);
    exceptions = S.exceptions.map((e) => e.trim().toLowerCase()).filter(Boolean);
    const custom = S.customRules
      .filter((r) => r && r.selector && isValidSelector(r.selector))
      .map((r) => ({ gen: r.gen || 'blur', selector: r.selector }));
    ruleList = [...custom, ...HDS.RULES.map((r) => ({ gen: r.gen, selector: r.sel.join(',') }))];
    blurSelector = [
      ...HDS.BLUR_SELECTORS,
      ...custom.filter((r) => r.gen === 'blur').map((r) => r.selector)
    ].join(',');
    dict.clear();
    dictRe = null;
  }

  function isValidSelector(sel) {
    try {
      document.createDocumentFragment().querySelector(sel);
      return true;
    } catch {
      return false;
    }
  }

  // ---------- Wörterbuch ----------
  function learn(original, fake, wordwise = true) {
    const add = (o, f) => {
      o = o.trim();
      f = f.trim();
      if (o.length < 3 || o === f || dict.has(o) || hasException(o) || F.isFake(o)) return;
      if (/^\d+$/.test(o)) return;
      dict.set(o, f);
      dictDirty = true;
    };
    add(original, fake);
    if (!wordwise) return;
    const ow = original.trim().split(/\s+/);
    const fw = fake.trim().split(/\s+/);
    if (ow.length === fw.length && ow.length > 1) ow.forEach((w, i) => add(w.replace(/[,]$/, ''), fw[i].replace(/[,]$/, '')));
  }
  function learnCompany(original, fake) {
    const o = F.companyParts(original).stem;
    const f = F.companyParts(fake).stem;
    if (o) learn(o, f, false);
    learn(original, fake, false);
    // Bewusst keine Einzelwörter lernen: "Startup Stuttgart" würde sonst jedes "Stuttgart" ersetzen.
  }
  function buildDictRe() {
    if (!dictDirty && dictRe !== null) return;
    dictDirty = false;
    const keys = [...dict.keys()].sort((a, b) => b.length - a.length).map(escapeRe);
    dictRe = keys.length ? new RegExp(`(?<![\\p{L}\\p{N}])(?:${keys.join('|')})(?![\\p{L}\\p{N}])`, 'gu') : null;
  }

  // ---------- Erkennung ----------
  function recordTitleRule() {
    const type = HDS.recordTypeFromUrl();
    return type ? { gen: type, selector: HDS.RECORD_TITLE_SELECTORS.join(',') } : null;
  }

  // Welcher Generator ist für dieses Element zuständig?
  function matchFor(el, titleRule) {
    // Innerste Treffer gewinnen (z. B. Avatar-Initialen innerhalb der Namenszelle);
    // bei Gleichstand die zuerst gelistete Regel (eigene Regeln stehen vorn).
    let best = null;
    for (const r of ruleList) {
      if (r.gen === 'blur') continue;
      const hit = el.closest(r.selector);
      if (hit && (!best || (hit !== best.el && best.el.contains(hit)))) best = { gen: r.gen, el: hit };
    }
    // HubSpot-Property-Namen (Seitenleiste, Kopf, Tabellenspalten, Formular-Antworten)
    const pm = propMatch(el);
    if (pm && (!best || (pm.el !== best.el && best.el.contains(pm.el)))) best = pm;
    if (best) return best;
    if (titleRule) {
      const hit = el.closest(titleRule.selector);
      if (hit && !hit.closest('nav, header [role="navigation"]')) return { gen: titleRule.gen, el: hit };
    }
    const c = el.closest('[data-hds-gen]');
    if (c) return { gen: c.getAttribute('data-hds-gen'), el, container: c };
    return null;
  }

  const headerCache = new WeakMap();
  function columnProp(td) {
    const table = td.closest('table');
    const idx = td.getAttribute('data-column-index');
    if (!table || idx === null) return null;
    let map = headerCache.get(table);
    if (!map || !map.has(idx)) {
      map = new Map();
      table.querySelectorAll('[data-column-index][data-test-id^="header-"]').forEach((th) => {
        const m = th.getAttribute('data-test-id').match(/^header-(\d+-\d+)-(.+)$/);
        if (m) map.set(th.getAttribute('data-column-index'), { obj: m[1], prop: m[2] });
      });
      headerCache.set(table, map);
    }
    return map.get(idx) || null;
  }

  function propMatch(el) {
    let best = null;
    const cand = (hit, prop, obj, fallback) => {
      if (!hit) return;
      const gen = HDS.genForProperty(prop, obj, fallback);
      if (gen && (!best || (hit !== best.el && best.el.contains(hit)))) best = { gen, el: hit };
    };
    const objType = (location.pathname.match(/\/(?:objects|record)\/(\d+-\d+)/) || [])[1];
    let h = el.closest('[data-selenium-test^="property-input-"]');
    if (h) cand(h, h.getAttribute('data-selenium-test').slice(15), objType);
    h = el.closest('[data-test-id^="highlight-property-display-"]');
    if (h) cand(h, h.getAttribute('data-test-id').slice(27), objType);
    h = el.closest('[data-test-id="submission-valid-input"]');
    if (h) {
      const dt = h.querySelector('[data-test-id^="field-label-"]');
      // Formularantworten: unbekannte Felder als Freitext behandeln
      if (dt && !dt.contains(el)) {
        // Nur den Wert treffen, nicht die Feldbeschriftung
        const val = el.closest('[data-test-id="submission-input-value"]') || h;
        const sec = h.closest('[data-test-id^="expandable-section"]');
        const obj = sec && /Unternehmen|Company/i.test(sec.parentElement ? sec.parentElement.textContent.slice(0, 40) : '') ? '0-2' : '0-1';
        cand(val, dt.getAttribute('data-test-id').slice(12), obj, 'text');
      }
    }
    const td = el.closest('td[data-column-index]');
    if (td) {
      const c = columnProp(td);
      if (c) cand(td, c.prop, c.obj);
    }
    return best;
  }

  function textNodes(root) {
    if (root.nodeType === Node.TEXT_NODE) return [root];
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    let n;
    while ((n = w.nextNode())) out.push(n);
    return out;
  }

  const LABEL_STRIP = /[\s:*]+$/;
  function scanLabels(nodes) {
    for (const n of nodes) {
      const t = n.data.trim().replace(LABEL_STRIP, '').toLowerCase();
      if (t.length > 40) continue;
      const gen = HDS.labelGen(t);
      if (!gen) continue;
      const label = n.parentElement;
      if (!label || label.closest(HDS.IGNORE_SELECTOR) || label.closest(HDS.LABEL_EXCLUDE)) continue;
      // Buttons/Tabs ("E-Mail"-Aktionsbutton) sind keine Feld-Labels
      // (Tooltip-Spans mit tabindex und explizite Property-Labels zählen nicht als Button)
      let interactive = false;
      if (!label.closest('[data-test-id*="property-label"]')) {
        for (let e = label, i = 0; e && i < 4; i++, e = e.parentElement) {
          if (e.hasAttribute('tabindex') && e.tagName !== 'SPAN') interactive = true;
        }
      }
      if (interactive) continue;
      // Container finden: nächster Vorfahr, der mehr als nur das Label enthält
      let c = label.parentElement;
      let found = false;
      for (let i = 0; c && c !== document.body && i < 10; i++, c = c.parentElement) {
        const len = c.textContent.trim().length;
        const hasInput = !!c.querySelector('input,textarea,[contenteditable="true"]');
        if (len > t.length + 1 || hasInput) {
          found = true;
          break;
        }
      }
      if (!found) continue;
      // Nur kompakte Label/Wert-Paare – keine Fließtexte oder ganze Karten
      if (c.textContent.trim().length - t.length > 200) continue;
      const others = textNodes(c).filter((x) => x !== n);
      if (others.length > 6) continue;
      if (others.some((x) => HDS.labelGen(x.data.trim().replace(LABEL_STRIP, '').toLowerCase()))) continue;
      label.setAttribute('data-hds-label', '');
      c.setAttribute('data-hds-gen', gen);
    }
  }

  // Wendet Regex + Wörterbuch auf Fließtext an
  function transform(s) {
    const C = S.categories;
    let out = s;
    const guard = (fn) => (m, ...a) => (hasException(m) || F.isFake(m) ? m : fn(m, ...a));
    if (C.emails) out = out.replace(HDS.RE.email, guard(F.email));
    if (C.domains) out = out.replace(HDS.RE.url, guard((m, host, path) => F.url(m, host, path)));
    if (C.phones) out = out.replace(HDS.RE.phone, guard(F.phone));
    if (C.amounts) out = out.replace(HDS.RE.amount, guard(F.amount)).replace(HDS.RE.iban, guard(F.phone));
    if ((C.names || C.companies) && dictRe) out = out.replace(dictRe, (m) => dict.get(m) || m);
    return out;
  }
  function needsBlur(s) {
    const C = S.categories;
    const t = (re) => { re.lastIndex = 0; const r = re.test(s); re.lastIndex = 0; return r; };
    return (
      (C.emails && t(HDS.RE.email)) ||
      (C.domains && t(HDS.RE.url)) ||
      (C.phones && t(HDS.RE.phone)) ||
      (C.amounts && (t(HDS.RE.amount) || t(HDS.RE.iban))) ||
      ((C.names || C.companies) && dictRe && t(dictRe))
    );
  }

  function currentOriginal(node) {
    return fakeOf.has(node) && fakeOf.get(node) === node.data ? origOf.get(node) : node.data;
  }
  function write(node, original, result) {
    if (result === original) {
      if (fakeOf.has(node) && node.data !== original) node.data = original;
      fakeOf.delete(node);
      origOf.delete(node);
      touched.delete(node);
      return;
    }
    origOf.set(node, original);
    fakeOf.set(node, result);
    touched.add(node);
    if (node.data !== result) node.data = result;
  }

  function processText(node, titleRule, phase) {
    const p = node.parentElement;
    // Feld-Beschriftungen (<label for>) sind keine Daten
    if (!p || p.closest(HDS.IGNORE_SELECTOR) || p.closest('[data-hds-label],label[for]')) return;
    const original = currentOriginal(node);
    // Leere Werte / Platzhalter ("--", "–") nicht anfassen
    if (!/[\p{L}\p{N}]/u.test(original)) return;
    // Browser-Tab-Titel lässt sich nicht verwischen → immer ersetzen (auch im Blur-Modus)
    const isTitle = p.tagName === 'TITLE';
    const m = isTitle ? null : matchFor(p, titleRule);
    const structured = m && catOn(m.gen) && !hasException(original) && !HDS.PLACEHOLDER.test(original.trim());

    if (phase === 1 && !structured) return; // Phase 1 = nur strukturierte Felder (zum Lernen)
    if (phase === 2 && structured) return;

    let fake = null;
    if (structured) {
      fake = F.gen(m.gen, original);
      // Auch im Blur-Modus lernen: Wörterbuch dient dort zum Finden von Erwähnungen + Tab-Titel
      if (['person', 'firstname', 'lastname', 'owner'].includes(m.gen)) learn(original, fake);
      else if (m.gen === 'company') learnCompany(original, fake);
      else if (m.gen === 'deal') learn(original, fake, false);
    }

    if (S.mode === 'blur' && !isTitle) {
      if (structured) (m.container ? p : m.el).classList.add(BLUR);
      else if (needsBlur(original)) p.classList.add(BLUR);
      return;
    }
    write(node, original, structured ? fake : transform(original));
  }

  function processTitleAttr(el) {
    if (el.closest(HDS.IGNORE_SELECTOR)) return;
    const cur = el.getAttribute('title');
    if (cur === null) return;
    const original = titleFake.get(el) === cur ? titleOrig.get(el) : cur;
    if (!original.trim()) return;
    const m = matchFor(el, recordTitleRule());
    let result;
    if (S.mode === 'blur') result = (m && catOn(m.gen)) || needsBlur(original) ? '' : original;
    else result = m && catOn(m.gen) && !hasException(original) ? F.gen(m.gen, original) : transform(original);
    if (result === original) return;
    titleOrig.set(el, original);
    titleFake.set(el, result);
    titled.add(el);
    el.setAttribute('title', result);
  }

  function processInputs(root) {
    if (!root.querySelectorAll) return;
    const list = root.matches && root.matches('input,textarea') ? [root] : root.querySelectorAll('input,textarea');
    for (const el of list) {
      if (el.type === 'hidden' || el.type === 'checkbox' || el.type === 'radio' || el.closest(HDS.IGNORE_SELECTOR)) continue;
      const m = matchFor(el, null);
      const sensitive =
        (m && catOn(m.gen)) ||
        (el.type === 'email' && S.categories.emails) ||
        (el.type === 'tel' && S.categories.phones) ||
        (el.value && needsBlur(el.value));
      if (sensitive) el.classList.add(BLUR);
    }
  }

  function processBlurImages(root) {
    if (!root.querySelectorAll || !blurSelector) return;
    if (root.matches && root.matches(blurSelector)) root.classList.add(BLUR);
    root.querySelectorAll(blurSelector).forEach((el) => el.classList.add(BLUR));
  }

  // Einstiegspunkt für einen (Teil-)Baum
  function process(root) {
    if (!root || root.nodeType === Node.COMMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.closest(HDS.IGNORE_SELECTOR)) return;
    const nodes = textNodes(root);
    const titleRule = recordTitleRule();
    scanLabels(nodes);
    // Phase 1: strukturierte Felder ersetzen und Namen/Firmen lernen
    for (const n of nodes) processText(n, titleRule, 1);
    const grew = dictDirty;
    buildDictRe();
    // Phase 2: Fließtext (Regex + gelerntes Wörterbuch)
    for (const n of nodes) processText(n, titleRule, 2);
    if (root.nodeType === Node.ELEMENT_NODE) {
      processBlurImages(root);
      processInputs(root);
      if (root.hasAttribute('title')) processTitleAttr(root);
      root.querySelectorAll('[title]').forEach(processTitleAttr);
    }
    if (grew && root !== document.documentElement) onDictGrow();
  }

  function restoreAll() {
    for (const n of touched) {
      if (n.data === fakeOf.get(n)) n.data = origOf.get(n);
      fakeOf.delete(n);
      origOf.delete(n);
    }
    touched.clear();
    for (const el of titled) {
      if (el.getAttribute('title') === titleFake.get(el)) el.setAttribute('title', titleOrig.get(el));
    }
    titled.clear();
    document.querySelectorAll('.' + BLUR).forEach((el) => el.classList.remove(BLUR));
    document.querySelectorAll('[data-hds-gen],[data-hds-label]').forEach((el) => {
      el.removeAttribute('data-hds-gen');
      el.removeAttribute('data-hds-label');
    });
    dict.clear();
    dictRe = null;
  }

  HDS.anonymizer = {
    configure,
    process,
    processText: (n) => processText(n, recordTitleRule(), 0),
    processTitleAttr,
    restoreAll,
    setOnDictGrow: (fn) => (onDictGrow = fn),
    get settings() { return S; },
    _dict: dict
  };
})();
