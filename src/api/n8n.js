const BASE = import.meta.env.VITE_N8N_BASE_URL;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
  return res.json();
}

export const getContacts = () => request('/webhook/contacts');

export const getStats = () => request('/webhook/stats');

export const startCampaign = () =>
  request('/webhook/start', { method: 'POST' });

export const pauseCampaign = () =>
  request('/webhook/pause', { method: 'POST' });

export const saveSettings = (settings) =>
  request('/webhook/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

export const saveTemplate = (template) =>
  request('/webhook/template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template }),
  });

export const sendNow = (intervalMinutes) =>
  request('/webhook/send-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intervalMinutes }),
  });
