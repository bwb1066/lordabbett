import { loadFragment } from '../fragment/fragment.js';

let modal = null;

function close() {
  if (modal) {
    modal.remove();
    modal = null;
    document.body.style.overflow = '';
  }
}

export default async function open() {
  if (modal) return;

  // Load CSS
  if (!document.querySelector('link[href*="geo-selector.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/blocks/geo-selector/geo-selector.css';
    document.head.append(link);
  }

  const fragment = await loadFragment('/fragments/geo-selector');
  if (!fragment) return;

  const content = fragment.querySelector(':scope > div > div') || fragment.querySelector(':scope > div');
  if (!content) return;

  // Parse fragment content
  const heading = content.querySelector('h3');
  const picture = content.querySelector('picture');
  const links = [...content.querySelectorAll('a')];
  const allPs = [...content.querySelectorAll('p')];

  // Find labels and terms
  let locationLabel = '';
  let locationName = '';
  let roleLabel = '';
  let termsHtml = '';

  allPs.forEach((p) => {
    const text = p.textContent.trim();
    if (text === 'Select Your Location') locationLabel = text;
    else if (text === 'Select Your Role') roleLabel = text;
    else if (text.startsWith('By using')) termsHtml = p.innerHTML;
    else if (!p.querySelector('a') && !p.querySelector('picture') && text) locationName = text;
  });

  // Role links (exclude Terms of Use link)
  const roleLinks = links.filter((a) => !a.textContent.includes('Terms'));

  // Build modal
  const overlay = document.createElement('div');
  overlay.className = 'geo-selector-overlay';

  const modalEl = document.createElement('div');
  modalEl.className = 'geo-selector-modal';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'geo-selector-close';
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', close);
  modalEl.append(closeBtn);

  // Heading
  if (heading) {
    const h = document.createElement('h3');
    h.textContent = heading.textContent;
    modalEl.append(h);
  }

  // Location
  if (locationLabel) {
    const label = document.createElement('span');
    label.className = 'geo-selector-label';
    label.textContent = locationLabel;
    modalEl.append(label);
  }

  const locationBox = document.createElement('div');
  locationBox.className = 'geo-selector-location';
  const locationLeft = document.createElement('div');
  locationLeft.className = 'geo-selector-location-left';
  if (picture) locationLeft.append(picture);
  const nameSpan = document.createElement('span');
  nameSpan.textContent = locationName || 'United States';
  locationLeft.append(nameSpan);
  locationBox.append(locationLeft);
  const chevron = document.createElement('span');
  chevron.className = 'geo-selector-location-chevron';
  chevron.textContent = '▾';
  locationBox.append(chevron);
  modalEl.append(locationBox);

  // Role label
  if (roleLabel) {
    const rLabel = document.createElement('span');
    rLabel.className = 'geo-selector-label';
    rLabel.textContent = roleLabel;
    modalEl.append(rLabel);
  }

  // Role links
  const roles = document.createElement('div');
  roles.className = 'geo-selector-roles';
  roleLinks.forEach((a) => {
    const role = document.createElement('a');
    role.href = a.href;
    role.className = 'geo-selector-role';
    role.textContent = a.textContent.trim();
    roles.append(role);
  });
  modalEl.append(roles);

  // Terms
  if (termsHtml) {
    const terms = document.createElement('p');
    terms.className = 'geo-selector-terms';
    terms.innerHTML = termsHtml;
    modalEl.append(terms);
  }

  overlay.append(modalEl);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.body.append(overlay);
  document.body.style.overflow = 'hidden';
  modal = overlay;
}
