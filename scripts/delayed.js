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
