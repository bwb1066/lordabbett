export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 3) return;

  // Row 0: heading
  const headingRow = rows[0];
  headingRow.classList.add('webinar-heading');

  // Row 1: date badges (month + day per column)
  const badgeRow = rows[1];
  const badges = [...badgeRow.querySelectorAll(':scope > div')];

  // Row 2: cards
  const cardsRow = rows[2];
  cardsRow.classList.add('webinar-cards');
  const cards = [...cardsRow.querySelectorAll(':scope > div')];

  // Overlay date badges on each card's image
  cards.forEach((card, i) => {
    const badge = badges[i];
    if (badge) {
      const text = badge.textContent.trim();
      const parts = text.split(/\s+/);
      const month = parts[0] || '';
      const day = parts[1] || '';

      const pic = card.querySelector('picture');
      if (pic) {
        const wrap = document.createElement('div');
        wrap.className = 'webinar-img-wrap';
        pic.parentNode.insertBefore(wrap, pic);
        wrap.append(pic);

        const badgeEl = document.createElement('div');
        badgeEl.className = 'webinar-date-badge';
        badgeEl.innerHTML = `<span class="webinar-badge-month">${month}</span><span class="webinar-badge-day">${day}</span>`;
        wrap.append(badgeEl);
      }
    }

    // Style the status label (strong inside first p)
    const firstP = card.querySelector('p');
    if (firstP) {
      const strong = firstP.querySelector('strong');
      if (strong) {
        strong.classList.add('webinar-status');
      }
    }

    // Style CE Credit / tags (h5)
    const tag = card.querySelector('h5');
    if (tag) {
      tag.classList.add('webinar-tag');
    }
  });

  // Remove the badge row from DOM
  badgeRow.remove();

  // Row 3 (now row 2): View all link
  const linkRow = rows[3];
  if (linkRow) {
    linkRow.classList.add('webinar-footer');
    const link = linkRow.querySelector('a');
    if (link) {
      link.classList.add('webinar-view-all');
    }
  }
}
