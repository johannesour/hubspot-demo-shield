// Einstieg: Einstellungen laden, DOM beobachten, auf Änderungen reagieren.
(() => {
  const HDS = self.HDS;
  const A = HDS.anonymizer;
  const html = document.documentElement;
  let enabled = false;
  let observer = null;
  let rescanTimer = null;

  const markReady = () => html.classList.add('hds-ready');

  function onMutations(records) {
    if (!enabled) return;
    try {
      for (const r of records) {
        if (r.type === 'childList') r.addedNodes.forEach((n) => A.process(n));
        else if (r.type === 'characterData') A.process(r.target);
        else if (r.type === 'attributes') {
          if (r.attributeName === 'title') A.processTitleAttr(r.target);
          else A.process(r.target); // z. B. Avatar bekommt erst nach dem Laden data-source="KNOWN-SRC"
        }
      }
    } finally {
      observer.takeRecords(); // eigene Änderungen ignorieren
    }
  }

  function fullScan() {
    if (!enabled) return;
    A.process(html);
    observer && observer.takeRecords();
  }

  A.setOnDictGrow(() => {
    clearTimeout(rescanTimer);
    rescanTimer = setTimeout(fullScan, 30);
  });

  function apply(settings) {
    const wasEnabled = enabled;
    enabled = !!settings.enabled;
    if (wasEnabled) A.restoreAll();
    A.configure(settings);
    if (!observer) {
      observer = new MutationObserver(onMutations);
      observer.observe(html, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'data-source', 'src'] });
    }
    if (enabled) {
      try {
        fullScan();
      } catch (e) {
        console.warn('[HubSpot Demo Shield] Fehler – Seite bleibt zur Sicherheit unscharf.', e);
        return;
      }
    }
    observer.takeRecords();
    markReady();
  }

  // Bei SPA-Navigation (pushState) Seitentyp neu bewerten
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      fullScan();
    }
  }, 300);

  chrome.storage.local
    .get(null)
    .then((s) => apply(HDS.withDefaults(s)))
    .catch((e) => {
      console.warn('[HubSpot Demo Shield] Einstellungen nicht lesbar', e);
      markReady();
    });

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== 'local') return;
    chrome.storage.local.get(null).then((s) => apply(HDS.withDefaults(s)));
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'hds-pick' && window === window.top) HDS.picker.start(msg.gen || 'blur');
  });
})();
