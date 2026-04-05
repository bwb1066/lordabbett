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
        sections.querySelectorAll('.nav-item').forEach((item) => {
          item.setAttribute('aria-expanded', false);
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
  sections.querySelectorAll('.nav-item').forEach((item) => {
    item.setAttribute('aria-expanded', expanded);
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
        const utilLinks = document.createElement('div');
        utilLinks.className = 'nav-util-links';
        rightCol.querySelectorAll('a').forEach((a) => {
          const link = document.createElement('a');
          link.href = a.href;
          link.textContent = a.textContent.trim();
          if (link.textContent === 'Login/Register') link.className = 'nav-login-btn';
          utilLinks.append(link);
        });
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
        navItem.setAttribute('aria-expanded', 'false');
        navItem.dataset.nav = label;

        const navLabel = document.createElement('button');
        navLabel.className = 'nav-item-label';
        navLabel.type = 'button';

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
          const isExpanded = navItem.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navItems);
          navItem.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
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
      searchPanel.innerHTML = `<div class="nav-search-panel-inner">
        <span class="search-icon"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" aria-hidden="true" height="24" width="24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg></span>
        <input type="text" aria-label="Search">
        <button type="button" class="nav-search-submit" aria-label="Submit search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
      </div>`;

      searchBtn.addEventListener('click', () => {
        const isActive = searchBtn.classList.toggle('active');
        searchPanel.classList.toggle('active', isActive);
        if (isActive) {
          toggleAllNavSections(navItems);
          showBackdrop(navItems);
          searchPanel.querySelector('input').focus();
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

  // Hamburger
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => {
    const navSections = nav.querySelector('.nav-sections');
    toggleMenu(nav, navSections);
  });
  navInner.prepend(hamburger);

  nav.setAttribute('aria-expanded', 'false');

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  if (utilitiesBar) navWrapper.append(utilitiesBar);
  navWrapper.append(nav);
  if (searchPanel) navWrapper.append(searchPanel);
  block.append(navWrapper);
}
