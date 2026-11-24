// Minimaler chrome.*-Ersatz, damit die Content-Scripts auf einer lokalen Testseite laufen.
(() => {
  const q = new URLSearchParams(location.search);
  const store = {
    enabled: q.get('enabled') !== '0',
    mode: q.get('mode') || 'fake',
    seed: 'test',
    exceptions: (q.get('ex') || '').split(',').filter(Boolean)
  };
  const listeners = [];
  window.chrome = {
    storage: {
      local: {
        get: async () => JSON.parse(JSON.stringify(store)),
        set: async (o) => {
          const changes = {};
          for (const k in o) changes[k] = { oldValue: store[k], newValue: o[k] };
          Object.assign(store, o);
          listeners.forEach((l) => l(changes, 'local'));
        }
      },
      onChanged: { addListener: (fn) => listeners.push(fn) }
    },
    runtime: { onMessage: { addListener: () => {} } }
  };
})();
