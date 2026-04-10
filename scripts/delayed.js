// Accessibility launcher
(function loadA11yLauncher() {
  const launcher = document.createElement('button');
  launcher.className = 'a11y-launcher';
  launcher.setAttribute('aria-label', 'Explore your accessibility options');

  launcher.innerHTML = `<span class="a11y-launcher-label">Explore your accessibility options</span>
    <span class="a11y-launcher-icon">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor">
        <circle cx="16" cy="16" r="16" fill="#4a7fc1"/>
        <circle cx="16" cy="8" r="2.5" fill="#fff"/>
        <path d="M22.5 12.5c0 0-3.2-1-6.5-1s-6.5 1-6.5 1l.8 2.5h4.2v4l-2.5 7h3l2-5 2 5h3l-2.5-7v-4h4.2l.8-2.5z" fill="#fff"/>
      </svg>
    </span>`;

  document.body.append(launcher);
}());

// AI Concierge launcher
(function loadAiLauncher() {
  const launcher = document.createElement('button');
  launcher.className = 'ai-launcher';
  launcher.setAttribute('aria-label', 'Continue the conversation');

  launcher.innerHTML = `<span class="ai-launcher-label">Continue the conversation</span>
    <span class="ai-launcher-icon">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#4a7fc1"/>
        <path d="M16 6l1.5 4.5L22 12l-4.5 1.5L16 18l-1.5-4.5L10 12l4.5-1.5L16 6z" fill="#fff"/>
        <path d="M22 18l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="#fff"/>
        <path d="M10 18l.7 2.3L13 21l-2.3.7L10 24l-.7-2.3L7 21l2.3-.7L10 18z" fill="#fff"/>
      </svg>
    </span>`;

  launcher.addEventListener('click', async () => {
    const { default: openConcierge } = await import('../blocks/brand-concierge/brand-concierge.js');
    openConcierge();
  });

  document.body.append(launcher);
}());

// Config launcher (Adobe A icon)
(function loadConfigLauncher() {
  const SUPABASE_BASE = 'https://cyjquwhkmzyedkwuaffc.supabase.co/functions/v1';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5anF1d2hrbXp5ZWRrd3VhZmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY4MjcsImV4cCI6MjA5MDY0MjgyN30.GkMBLXBZr9u34m4uI6ZR-2ZniLZD3RkjropjQw058k4';

  const hdrs = () => ({
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
  });

  const wrap = document.createElement('div');
  wrap.className = 'config-launcher-wrap';

  const btn = document.createElement('button');
  btn.className = 'config-launcher';
  btn.setAttribute('aria-label', 'Configuration');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22" fill="none"><path d="M14.2353 21.6209L12.4925 16.7699H8.11657L11.7945 7.51237L17.3741 21.6209H24L15.1548 0.379395H8.90929L0 21.6209H14.2353Z" fill="#EB1000"></path></svg>';

  const panel = document.createElement('div');
  panel.className = 'config-panel';
  panel.innerHTML = `
    <h3 class="config-panel-title">Configuration</h3>
    <label class="config-label">Brand Name:
      <input type="text" class="cfg-brand-name" placeholder="My Brand">
    </label>
    <label class="config-label">Domain:
      <input type="text" class="cfg-domain" placeholder="example.com">
    </label>
    <label class="config-label">Vector Store:
      <input type="text" class="cfg-vector-store" placeholder="vs_abc123 (optional)">
    </label>
    <label class="config-label">Instructions:
      <textarea class="cfg-instructions" rows="4"
        placeholder="Custom system prompt (optional)"></textarea>
    </label>
    <label class="config-label">Contact URL:
      <input type="text" class="cfg-contact-url" placeholder="https://...">
    </label>
    <div class="config-actions">
      <button type="button" class="cfg-save">Save</button>
    </div>`;

  // Load current config on open
  const loadCfg = async () => {
    try {
      const r = await fetch(
        `${SUPABASE_BASE}/brand-config?site_key=lordabbett`,
        { headers: hdrs() },
      );
      const c = await r.json();
      if (c.error) return;
      panel.querySelector('.cfg-brand-name').value = c.brand_name || '';
      panel.querySelector('.cfg-domain').value = (c.domains || []).join(', ');
      panel.querySelector('.cfg-vector-store').value = c.vector_store_id || '';
      panel.querySelector('.cfg-instructions').value = c.instructions || '';
      panel.querySelector('.cfg-contact-url').value = c.contact_url || '';
    } catch { /* ignore */ }
  };

  // Save config
  panel.querySelector('.cfg-save').addEventListener('click', async () => {
    const brandName = panel.querySelector('.cfg-brand-name').value.trim();
    const domains = panel.querySelector('.cfg-domain').value
      .split(',').map((d) => d.trim()).filter(Boolean);
    const body = {
      site_key: brandName.toLowerCase().replace(/\s+/g, '-') || 'lordabbett',
      domains,
      brand_name: brandName,
      instructions: panel.querySelector('.cfg-instructions').value,
      vector_store_id: panel.querySelector('.cfg-vector-store').value || null,
      contact_url: panel.querySelector('.cfg-contact-url').value || null,
    };
    try {
      await fetch(`${SUPABASE_BASE}/brand-config`, {
        method: 'POST',
        headers: hdrs(),
        body: JSON.stringify(body),
      });
      panel.classList.remove('active');
    } catch { /* ignore */ }
  });

  btn.addEventListener('click', () => {
    const opening = !panel.classList.contains('active');
    panel.classList.toggle('active');
    if (opening) loadCfg();
  });

  wrap.append(btn);
  wrap.append(panel);
  document.body.append(wrap);
}());
