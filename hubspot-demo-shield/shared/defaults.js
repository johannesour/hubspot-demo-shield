// Gemeinsame Standardeinstellungen für Background, Popup und Content-Scripts.
(() => {
  const root = typeof self !== 'undefined' ? self : window;
  root.HDS = root.HDS || {};
  root.HDS.DEFAULTS = {
    enabled: false,
    mode: 'fake', // 'fake' | 'blur'
    categories: {
      names: true,
      emails: true,
      phones: true,
      addresses: true,
      companies: true,
      domains: true,
      amounts: true,
      freetext: true,
      personal: true, // Geburtstage, Mitglieds-/Kundennummern, IBAN
      owners: false // zuständige Mitarbeiter (eigenes Team)
    },
    seed: '',
    exceptions: [],
    customRules: [] // [{ selector, gen }]
  };
  root.HDS.withDefaults = (s = {}) => ({
    ...root.HDS.DEFAULTS,
    ...s,
    categories: { ...root.HDS.DEFAULTS.categories, ...(s.categories || {}) },
    exceptions: Array.isArray(s.exceptions) ? s.exceptions : [],
    customRules: Array.isArray(s.customRules) ? s.customRules : []
  });
  root.HDS.randomSeed = () => Math.random().toString(36).slice(2, 10);
})();
