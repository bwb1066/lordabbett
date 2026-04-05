import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

let backdrop = null;

function hideBackdrop() {
  if (backdrop) {
    backdrop.remove();
    backdrop = null;
  }
  document.body.style.overflow = '';
}

function showBackdrop(sections) {
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.addEventListener('click', () => {
      if (sections) {
        sections.querySelectorAll('.nav-item-label').forEach((btn) => {
          btn.setAttribute('aria-expanded', 'false');
        });
      }
      // Close search panel if open
      document.querySelector('.nav-search.active')?.classList.remove('active');
      document.querySelector('.nav-search-panel.active')?.classList.remove('active');
      hideBackdrop();
    });
    document.body.append(backdrop);
  }
  document.body.style.overflow = 'hidden';
}

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-item-label').forEach((btn) => {
    btn.setAttribute('aria-expanded', expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, 'false');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') toggleMenu(nav, navSections, false);
    });
  }
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // --- Utilities bar ---
  const utilitiesBlock = nav.querySelector('.utilities');
  let utilitiesBar = null;
  let searchPanel = null;
  if (utilitiesBlock) {
    utilitiesBar = document.createElement('div');
    utilitiesBar.className = 'nav-utilities';

    const utilitiesInner = document.createElement('div');
    utilitiesInner.className = 'nav-utilities-inner';

    const row = utilitiesBlock.querySelector(':scope > div') || utilitiesBlock;
    const cols = [...row.querySelectorAll(':scope > div')];
    if (cols.length >= 2) {
      const [leftCol, rightCol] = cols;

      if (leftCol) {
        const roleSelector = document.createElement('div');
        roleSelector.className = 'nav-role-selector';
        roleSelector.innerHTML = leftCol.innerHTML;
        roleSelector.querySelectorAll('a').forEach((a) => {
          a.replaceWith(...a.childNodes);
        });
        roleSelector.style.cursor = 'pointer';
        roleSelector.addEventListener('click', async () => {
          const { default: openGeoSelector } = await import('../geo-selector/geo-selector.js');
          openGeoSelector();
        });
        utilitiesInner.append(roleSelector);
      }

      if (rightCol) {
        // Collect link data before consuming DOM
        const linkData = [];
        rightCol.querySelectorAll('a').forEach((a) => {
          linkData.push({
            href: a.href,
            text: a.textContent.trim(),
          });
        });

        const utilLinks = document.createElement('div');
        utilLinks.className = 'nav-util-links';
        linkData.forEach((d) => {
          const link = document.createElement('a');
          link.href = d.href;
          link.textContent = d.text;
          if (d.text === 'Login/Register') {
            link.className = 'nav-login-btn';
          }
          utilLinks.append(link);
        });

        // Mobile "..." more button + popover
        const moreWrap = document.createElement('div');
        moreWrap.className = 'nav-mobile-more-wrap';

        const moreBtn = document.createElement('button');
        moreBtn.className = 'nav-mobile-more';
        moreBtn.type = 'button';
        moreBtn.setAttribute('aria-label', 'More');
        moreBtn.innerHTML = '&middot;&middot;&middot;';

        const popover = document.createElement('div');
        popover.className = 'nav-mobile-popover';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'nav-mobile-popover-close';
        closeBtn.type = 'button';
        closeBtn.innerHTML = '&times;';
        popover.append(closeBtn);
        linkData.forEach((d) => {
          if (d.text !== 'Login/Register') {
            const link = document.createElement('a');
            link.href = d.href;
            link.textContent = d.text;
            popover.append(link);
          }
        });

        moreBtn.addEventListener('click', () => {
          popover.classList.toggle('active');
        });
        closeBtn.addEventListener('click', () => {
          popover.classList.remove('active');
        });

        moreWrap.append(moreBtn);
        moreWrap.append(popover);
        utilLinks.append(moreWrap);

        utilitiesInner.append(utilLinks);
      }
    }

    utilitiesBar.append(utilitiesInner);
    utilitiesBlock.remove();
  }

  // --- Main nav ---
  const navBlock = nav.querySelector('.nav');
  const navInner = document.createElement('div');
  navInner.className = 'nav-inner';

  if (navBlock) {
    const contentDiv = navBlock.querySelector(':scope > div > div');
    if (contentDiv) {
      const tables = [...contentDiv.querySelectorAll(':scope > table')];

      // Extract logo from first table
      const firstTable = tables[0];
      let logoPicture = null;
      if (firstTable) {
        const pic = firstTable.querySelector('picture');
        if (pic) {
          logoPicture = pic;
        }
      }

      // Brand
      const brand = document.createElement('div');
      brand.className = 'nav-brand';
      if (logoPicture) {
        const brandLink = document.createElement('a');
        brandLink.href = '/';
        brandLink.setAttribute('aria-label', 'Lord Abbett Home');
        brandLink.append(logoPicture);
        brand.append(brandLink);
      }
      navInner.append(brand);

      // Nav items
      const navItems = document.createElement('div');
      navItems.className = 'nav-sections';

      tables.forEach((table) => {
        const rows = [...table.querySelectorAll('tr')];
        if (rows.length < 2) return;

        const labelRow = rows[0];
        const contentRow = rows[1];
        const label = labelRow.textContent.trim();

        // Use label row text, formatted: "about-us" → "About Us"
        const displayText = label
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        // Extract arrow icons (20x20 pictures) from any td
        const allPictures = [...contentRow.querySelectorAll('picture')];
        const arrowPics = allPictures.filter((p) => {
          const img = p.querySelector('img');
          return img && parseInt(img.getAttribute('width'), 10) <= 20;
        });
        let downArrow = arrowPics[0] || null;
        let upArrow = arrowPics[1] || null;

        // Fallback: create text arrows if no valid images found
        if (!downArrow || !downArrow.querySelector('img[src]')) downArrow = null;
        if (!upArrow || !upArrow.querySelector('img[src]')) upArrow = null;

        const navItem = document.createElement('div');
        navItem.className = 'nav-item';
        navItem.dataset.nav = label;

        const navLabel = document.createElement('button');
        navLabel.className = 'nav-item-label';
        navLabel.type = 'button';
        navLabel.setAttribute('aria-expanded', 'false');

        const labelText = document.createElement('span');
        labelText.textContent = displayText;
        navLabel.append(labelText);

        const downWrap = document.createElement('span');
        downWrap.className = 'nav-arrow-down';
        if (downArrow) {
          downWrap.append(downArrow);
        } else {
          const img = document.createElement('img');
          img.src = '/icons/down-facing-arrow.svg';
          img.alt = '';
          downWrap.append(img);
        }
        navLabel.append(downWrap);

        const upWrap = document.createElement('span');
        upWrap.className = 'nav-arrow-up';
        if (upArrow) {
          upWrap.append(upArrow);
        } else {
          const img = document.createElement('img');
          img.src = '/icons/upward-facing-arrow.svg';
          img.alt = '';
          upWrap.append(img);
        }
        navLabel.append(upWrap);

        navItem.append(navLabel);

        // Dropdown content
        const dropdown = document.createElement('div');
        dropdown.className = 'nav-dropdown';
        const dropdownInner = document.createElement('div');
        dropdownInner.className = 'nav-dropdown-inner';

        const tds = [...contentRow.querySelectorAll('td')];
        tds.forEach((td) => {
          const col = document.createElement('div');
          col.className = 'nav-dropdown-col';
          col.innerHTML = td.innerHTML;
          // Remove the logo picture if present
          const pic = col.querySelector('picture');
          if (pic) pic.closest('p')?.remove();
          // Remove duplicate label link
          const firstP = col.querySelector(':scope > p');
          if (firstP?.querySelector('a') && !firstP.querySelector('ul')) {
            const pLink = firstP.querySelector('a');
            if (pLink && pLink.textContent.trim() === displayText) firstP.remove();
          }
          dropdownInner.append(col);
        });

        dropdown.append(dropdownInner);
        navItem.append(dropdown);

        navLabel.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = navLabel.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navItems);
          navLabel.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
          if (!isExpanded) showBackdrop(navItems);
          else hideBackdrop();
        });

        navItems.append(navItem);
      });

      navInner.append(navItems);

      // Search icon
      const searchBtn = document.createElement('button');
      searchBtn.className = 'nav-search';
      searchBtn.type = 'button';
      searchBtn.setAttribute('aria-label', 'Search');
      searchBtn.innerHTML = '<span class="nav-search-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span><span class="nav-search-close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>';
      navInner.append(searchBtn);

      // Search panel
      searchPanel = document.createElement('div');
      searchPanel.className = 'nav-search-panel';
      searchPanel.innerHTML = `<div class="nav-search-panel-inner nav-search-row">
        <span class="search-icon"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" aria-hidden="true" height="24" width="24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg></span>
        <input type="text" aria-label="Search">
        <button type="button" class="nav-search-submit" aria-label="Submit search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
      </div>
      <div class="nav-search-panel-inner nav-ask-row">
        <span class="ask-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.91819 13.2491C9.69944 13.2491 9.47874 13.1924 9.27952 13.0772C8.79807 12.7989 8.55491 12.2471 8.67307 11.7041L9.40061 8.33011L7.08225 5.77249C6.7092 5.36038 6.64475 4.76077 6.92307 4.27933C7.20139 3.79691 7.75803 3.55374 8.29612 3.67288L11.6701 4.40042L14.2278 2.08206C14.6409 1.70706 15.2405 1.64554 15.7209 1.92288C16.2024 2.2012 16.4455 2.75296 16.3274 3.29593L15.5998 6.66995L17.9182 9.22757C18.2912 9.6387 18.3547 10.2383 18.0774 10.7198C17.7991 11.2002 17.2493 11.4453 16.7053 11.3282L13.3313 10.5987L10.7727 12.918C10.5315 13.1368 10.2258 13.2491 9.91819 13.2491ZM10.8918 8.53324L10.2873 11.333L12.4094 9.40921C12.7121 9.1348 13.1301 9.02151 13.5315 9.10745L16.3332 9.71292L14.4094 7.59085C14.134 7.28616 14.0217 6.86526 14.1096 6.46487L14.7131 3.66702L12.5911 5.59085C12.2864 5.86624 11.8664 5.97757 11.4651 5.89065L8.66722 5.28713L10.5911 7.4092C10.8664 7.71291 10.9787 8.13285 10.8918 8.53324Z" fill="url(#ai-icon-input-1)"></path><path d="M3.34569 18.252C3.21678 18.252 3.08788 18.2188 2.97069 18.1514C2.68846 17.9883 2.54393 17.6622 2.61229 17.3438L2.91893 15.9258L1.94432 14.8516C1.72557 14.6104 1.68748 14.2549 1.85057 13.9727C2.01366 13.6905 2.34178 13.5498 2.65819 13.6143L4.07616 13.9209L5.15038 12.9463C5.39257 12.7266 5.74608 12.6895 6.02929 12.8526C6.31152 13.0157 6.45605 13.3418 6.38769 13.6602L6.08105 15.0782L7.05566 16.1524C7.27441 16.3936 7.3125 16.7491 7.14941 17.0313C6.98632 17.3135 6.65722 17.4522 6.34179 17.3897L4.92382 17.0831L3.8496 18.0577C3.708 18.1856 3.52733 18.252 3.34569 18.252Z" fill="url(#ai-icon-input-2)"></path><defs><linearGradient id="ai-icon-input-1" x1="6.75122" y1="1.75085" x2="19.2946" y2="3.03523" gradientUnits="userSpaceOnUse"><stop stop-color="#D73220"></stop><stop offset="0.33" stop-color="#D92361"></stop><stop offset="1" stop-color="#7155FA"></stop></linearGradient><linearGradient id="ai-icon-input-2" x1="1.75" y1="12.7517" x2="7.75027" y2="13.3661" gradientUnits="userSpaceOnUse"><stop stop-color="#D73220"></stop><stop offset="0.33" stop-color="#D92361"></stop><stop offset="1" stop-color="#7155FA"></stop></linearGradient></defs></svg></span>
        <input type="text" class="nav-ask-input" placeholder="Ask a question" aria-label="Ask a question">
        <button type="button" class="nav-ask-submit" aria-label="Ask"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
      </div>`;

      const searchInput = searchPanel.querySelector('.nav-search-row input');
      const askInput = searchPanel.querySelector('.nav-ask-input');
      const askBtn = searchPanel.querySelector('.nav-ask-submit');

      const submitAsk = async () => {
        const query = askInput.value.trim();
        if (!query) return;
        askInput.value = '';
        searchBtn.classList.remove('active');
        searchPanel.classList.remove('active');
        hideBackdrop();
        const { default: openConcierge } = await import('../brand-concierge/brand-concierge.js');
        openConcierge(query);
      };

      askBtn.addEventListener('click', submitAsk);
      askInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitAsk();
        }
      });

      searchBtn.addEventListener('click', async () => {
        const mod = await import('../brand-concierge/brand-concierge.js');
        if (mod.hasConversation()) {
          mod.default();
          return;
        }
        const isActive = searchBtn.classList.toggle('active');
        searchPanel.classList.toggle('active', isActive);
        if (isActive) {
          toggleAllNavSections(navItems);
          showBackdrop(navItems);
          searchInput.focus();
        } else {
          hideBackdrop();
        }
      });
    }

    navBlock.remove();
  }

  // Clear nav and rebuild
  nav.textContent = '';
  nav.append(navInner);

  // Mobile login icon (between search and hamburger)
  const mobileLogin = document.createElement('a');
  mobileLogin.className = 'nav-mobile-login';
  mobileLogin.href = '#';
  mobileLogin.setAttribute('aria-label', 'Login/Register');
  mobileLogin.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7"/></svg>';
  navInner.append(mobileLogin);

  // Hamburger (at end for mobile)
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => {
    const navSections = nav.querySelector('.nav-sections');
    toggleMenu(nav, navSections);
  });
  navInner.append(hamburger);

  nav.setAttribute('aria-expanded', 'false');

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  if (utilitiesBar) navWrapper.append(utilitiesBar);
  navWrapper.append(nav);
  if (searchPanel) navWrapper.append(searchPanel);
  block.append(navWrapper);
}
