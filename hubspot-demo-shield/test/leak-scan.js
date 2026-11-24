// Leck-Scanner: in der DevTools-Konsole einer HubSpot-Seite ausführen (Extension im Blur-Modus).
// Liefert alle sichtbaren, NICHT verwischten Texte im Inhaltsbereich und markiert verdächtige.
(() => {
  const RE = {
    email: /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/,
    phone: /(?:\+|\b00)\d{1,3}[\s\-/().]*(?:\d[\s\-/().]*){5,14}\d|\b0[1-9]\d{1,5}[\s\-/]+\d{2,}/,
    url: /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:de|com|io|net|org|eu|ch|at)\b/i,
    amount: /(?:[€$£]|EUR|USD)\s?\d|\d\s?(?:[€$£]|EUR\b|USD\b)/
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
  };
  const root = document.querySelector('main, [role="main"], #main-content') || document.body;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Map();
  let n;
  while ((n = w.nextNode())) {
    const t = n.data.trim();
    if (t.length < 2 || !/[\p{L}\p{N}]/u.test(t)) continue;
    const p = n.parentElement;
    if (!p || p.closest('.hds-blur,script,style,noscript,#hs-nav-v4 nav ul,[data-hds-ignore]')) continue;
    if (!visible(p)) continue;
    const tid = p.closest('[data-test-id],[data-selenium-test]');
    const where = tid ? (tid.getAttribute('data-test-id') || tid.getAttribute('data-selenium-test')).replace(/\d{5,}/g, 'N').slice(0, 70) : p.tagName.toLowerCase();
    const flag = Object.keys(RE).filter((k) => RE[k].test(t));
    const key = t.slice(0, 80);
    if (!seen.has(key)) seen.set(key, { t: key, where, flag: flag.join(',') });
  }
  const all = [...seen.values()];
  return {
    url: location.pathname.replace(/\d{6,}/g, 'N'),
    blurred: document.querySelectorAll('.hds-blur').length,
    suspicious: all.filter((x) => x.flag),
    texts: all.filter((x) => !x.flag).map((x) => `${x.t}  ⟨${x.where}⟩`)
  };
})();
