importScripts('shared/defaults.js');

async function updateBadge(enabled) {
  await chrome.action.setBadgeText({ text: enabled ? 'ON' : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#0F766E' });
}

async function ensureDefaults() {
  const current = await chrome.storage.local.get(null);
  const merged = HDS.withDefaults(current);
  if (!merged.seed) merged.seed = HDS.randomSeed();
  await chrome.storage.local.set(merged);
  await updateBadge(merged.enabled);
}

chrome.runtime.onInstalled.addListener(ensureDefaults);
chrome.runtime.onStartup.addListener(ensureDefaults);

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-shield') return;
  const { enabled } = await chrome.storage.local.get('enabled');
  await chrome.storage.local.set({ enabled: !enabled });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.enabled) updateBadge(changes.enabled.newValue);
});
