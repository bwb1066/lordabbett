import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname
    : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  block.textContent = '';

  // Collect all sections from fragment
  const sections = [...fragment.querySelectorAll(':scope > div')];

  // Section 0: footer-columns (logo/social + nav)
  const colsSection = sections[0];
  const footerColsBlock = colsSection?.querySelector('.footer-columns');

  if (footerColsBlock) {
    const rows = [...footerColsBlock.children];

    // Row 0: logo + social
    const topBar = document.createElement('div');
    topBar.className = 'footer-top';

    if (rows[0]) {
      const cols = [...rows[0].children];
      // Logo
      const logoPic = cols[0]?.querySelector('picture');
      if (logoPic) {
        const logoLink = document.createElement('a');
        logoLink.href = '/';
        logoLink.className = 'footer-logo';
        logoLink.setAttribute('aria-label', 'Lord Abbett Home');
        logoLink.append(logoPic);
        topBar.append(logoLink);
      }
      // Social icons
      const socialCol = cols[cols.length - 1];
      if (socialCol) {
        const socialDiv = document.createElement('div');
        socialDiv.className = 'footer-social';
        socialCol.querySelectorAll('a').forEach((a) => {
          const link = document.createElement('a');
          link.href = a.href;
          link.target = '_blank';
          link.rel = 'noopener';
          link.setAttribute(
            'aria-label',
            a.title || 'Social media',
          );
          const pic = a.querySelector('picture');
          if (pic) link.append(pic);
          socialDiv.append(link);
        });
        topBar.append(socialDiv);
      }
    }
    block.append(topBar);

    // Row 1: nav columns
    if (rows[1]) {
      const nav = document.createElement('div');
      nav.className = 'footer-nav';
      [...rows[1].children].forEach((col) => {
        const navCol = document.createElement('div');
        const heading = col.querySelector(':scope > p');
        if (heading && !heading.querySelector('a')) {
          heading.classList.add('footer-nav-heading');
          navCol.append(heading);
        }
        const ul = col.querySelector('ul');
        if (ul) navCol.append(ul);
        nav.append(navCol);
      });
      block.append(nav);
    }
  }

  // Section 1: policy links
  if (sections[1]) {
    const policy = document.createElement('div');
    policy.className = 'footer-policy';
    sections[1].querySelectorAll('p').forEach((p) => {
      policy.append(p);
    });
    block.append(policy);
  }

  // Section 2: legal disclaimers
  if (sections[2]) {
    const legal = document.createElement('div');
    legal.className = 'footer-legal';
    sections[2].querySelectorAll('p').forEach((p) => {
      legal.append(p);
    });
    block.append(legal);
  }
}
