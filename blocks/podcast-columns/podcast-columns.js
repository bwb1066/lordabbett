function optimizeImage(picture, mobileWidth = 400, desktopWidth = 750) {
  picture.querySelectorAll('source').forEach((source) => {
    const srcset = source.getAttribute('srcset');
    if (srcset) {
      const width = source.media?.includes('min-width') ? desktopWidth : mobileWidth;
      source.setAttribute('srcset', srcset.replace(/width=\d+/, `width=${width}`));
    }
  });
  const img = picture.querySelector('img');
  if (img?.src) {
    img.src = img.src.replace(/width=\d+/, `width=${mobileWidth}`);
  }
}

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 3) return;

  // Row 0: heading
  rows[0].classList.add('podcast-heading');

  // Row 1: cards
  const cardsRow = rows[1];
  cardsRow.classList.add('podcast-cards');
  const cards = [...cardsRow.querySelectorAll(':scope > div')];

  // Row 2: timings (picture + duration text per column)
  const timingRow = rows[2];
  const timings = [...timingRow.querySelectorAll(':scope > div')];

  cards.forEach((card, i) => {
    // Wrap picture with overlay container
    const pic = card.querySelector('picture');
    if (pic) {
      optimizeImage(pic);
      const wrap = document.createElement('div');
      wrap.className = 'podcast-img-wrap';
      pic.parentNode.insertBefore(wrap, pic);
      wrap.append(pic);

      // Add timing badge from the timing row
      const timing = timings[i];
      if (timing) {
        const micPic = timing.querySelector('picture');
        const durationText = timing.textContent.trim();
        const badge = document.createElement('div');
        badge.className = 'podcast-mic-badge';
        if (micPic) badge.append(micPic);
        const span = document.createElement('span');
        span.textContent = durationText;
        badge.append(span);
        wrap.append(badge);
      }
    }

    // Style status label
    const firstP = card.querySelector('p');
    if (firstP) {
      const strong = firstP.querySelector('strong');
      if (strong) strong.classList.add('podcast-status');
    }
  });

  // Remove the timing row
  timingRow.remove();

  // Row 3 (now row 2): View all link
  const linkRow = rows[3];
  if (linkRow) {
    linkRow.classList.add('podcast-footer');
    const link = linkRow.querySelector('a');
    if (link) link.classList.add('podcast-view-all');
  }
}
