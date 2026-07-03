/*
 * Brand Concierge — site config wrapper.
 * The site launcher imports THIS file and calls the default export; we
 * configure the standard widget (vendored as brand-concierge-core.js) here so
 * the launcher/trigger stays unchanged.
 * Widget source of truth: github.com/bwb1066/brand-concierge
 */
import openConcierge, { init, hasConversation } from './brand-concierge-core.js';

const codeBase = (window.hlx && window.hlx.codeBasePath) || '';
init({
  supabaseUrl: 'https://cyjquwhkmzyedkwuaffc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5anF1d2hrbXp5ZWRrd3VhZmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjY4MjcsImV4cCI6MjA5MDY0MjgyN30.GkMBLXBZr9u34m4uI6ZR-2ZniLZD3RkjropjQw058k4',
  siteKey: 'lordabbett',
  showTrigger: false,
  widgetBase: `${codeBase}/blocks/brand-concierge/`,
});

export { init, hasConversation };
export default openConcierge;
