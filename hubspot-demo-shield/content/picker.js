// Element-Picker: Bereich auf der Seite anklicken → wird als eigene Regel gespeichert.
(() => {
  const HDS = (self.HDS = self.HDS || {});
  const STABLE_ATTRS = ['data-test-id', 'data-selenium-test', 'data-testid', 'data-test', 'data-selenium-component'];
  const HASHY = /^(sc-|css-|hds-|jsx-)|[A-Za-z]*\d[A-Za-z0-9]{4,}|__|--[a-z0-9]{5,}/;

  function tail(el) {
    const cls = [...el.classList].filter((c) => !HASHY.test(c)).slice(0, 2);
    return el.tagName.toLowerCase() + cls.map((c) => '.' + CSS.escape(c)).join('');
  }

  function selectorFor(el) {
    let cur = el;
    for (let depth = 0; cur && cur !== document.body && depth < 6; depth++, cur = cur.parentElement) {
      for (const a of STABLE_ATTRS) {
        const v = cur.getAttribute(a);
        if (v) {
          const base = `[${a}="${CSS.escape(v)}"]`;
          return cur === el ? base : `${base} ${tail(el)}`;
        }
      }
    }
    // Fallback: kurzer Strukturpfad
    const parts = [];
    cur = el;
    for (let i = 0; cur && cur !== document.body && i < 5; i++, cur = cur.parentElement) {
      if (cur.id && !/\d{3,}/.test(cur.id)) {
        parts.unshift('#' + CSS.escape(cur.id));
        break;
      }
      const idx = [...cur.parentElement.children].filter((c) => c.tagName === cur.tagName).indexOf(cur) + 1;
      parts.unshift(`${tail(cur)}:nth-of-type(${idx})`);
    }
    return parts.join(' > ');
  }

  let active = null;

  function stop() {
    if (!active) return;
    document.removeEventListener('mouseover', active.over, true);
    document.removeEventListener('click', active.click, true);
    document.removeEventListener('keydown', active.key, true);
    active.box.remove();
    active = null;
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.setAttribute('data-hds-ignore', '');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 2147483647, background: '#0F766E',
      color: '#fff', font: '13px/1.4 system-ui, sans-serif', padding: '10px 14px', borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,.25)', maxWidth: '360px'
    });
    document.documentElement.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  function start(gen) {
    stop();
    const box = document.createElement('div');
    box.setAttribute('data-hds-ignore', '');
    Object.assign(box.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: 2147483646, border: '2px solid #0F766E',
      background: 'rgba(15,118,110,.12)', borderRadius: '3px', transition: 'all .05s'
    });
    document.documentElement.appendChild(box);
    const over = (e) => {
      const r = e.target.getBoundingClientRect();
      Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    };
    const click = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const selector = selectorFor(e.target);
      stop();
      const { customRules = [] } = await chrome.storage.local.get('customRules');
      if (!customRules.some((r) => r.selector === selector && r.gen === gen)) {
        customRules.push({ selector, gen });
        await chrome.storage.local.set({ customRules });
      }
      toast(`Regel gespeichert: ${selector}`);
    };
    const key = (e) => {
      if (e.key === 'Escape') {
        stop();
        toast('Auswahl abgebrochen');
      }
    };
    document.addEventListener('mouseover', over, true);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key, true);
    active = { box, over, click, key };
    toast('Bereich anklicken, der anonymisiert werden soll (Esc = abbrechen)');
  }

  HDS.picker = { start, stop, selectorFor };
})();
