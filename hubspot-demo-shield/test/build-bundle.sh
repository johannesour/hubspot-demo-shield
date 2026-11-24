#!/bin/sh
# Baut test/inject-bundle.js: die Extension-Logik als ein Script, das man per
# DevTools-Konsole in eine Seite laden kann (zum Testen ohne Installation).
cd "$(dirname "$0")/.." || exit 1
python3 - <<'PY'
css = open('content/shield.css').read().replace('`', '')
files = ['shared/defaults.js', 'content/selectors.js', 'content/faker.js',
         'content/anonymizer.js', 'content/picker.js', 'content/main.js']
head = '''(() => {
  if (window.__hdsLoaded) return; window.__hdsLoaded = true;
  const css = document.createElement('style'); css.setAttribute('data-hds-ignore', '');
  css.textContent = `%s`;
  document.documentElement.appendChild(css);
  const store = { enabled: true, mode: 'fake', seed: 'test', exceptions: [], customRules: [] };
  const listeners = [];
  const chrome = {
    storage: { local: {
      get: async () => JSON.parse(JSON.stringify(store)),
      set: async (o) => { Object.assign(store, o); listeners.forEach((l) => l({}, 'local')); }
    }, onChanged: { addListener: (fn) => listeners.push(fn) } },
    runtime: { onMessage: { addListener: () => {} } }
  };
  window.__hds = { set: (o) => chrome.storage.local.set(o), store };
''' % css
body = ''.join('// ---- %s\n%s\n' % (f, open(f).read()) for f in files)
open('test/inject-bundle.js', 'w').write(head + body + '  window.__hds.HDS = self.HDS;\n})();\n')
PY
echo "test/inject-bundle.js gebaut"
