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
  if (rows.length < 2) return;

  // Row 0: heading
  rows[0].classList.add('insight-heading');

  // Row 1: cards
  rows[1].classList.add('insight-cards');
  const cards = [...rows[1].querySelectorAll(':scope > div')];
  cards.forEach((card) => {
    const pic = card.querySelector('picture');
    if (pic) optimizeImage(pic);
    const firstP = card.querySelector('p');
    if (firstP) {
      const strong = firstP.querySelector('strong');
      if (strong) strong.classList.add('insight-status');
    }
  });

  // Row 2: View all link
  if (rows[2]) {
    rows[2].classList.add('insight-footer');
    const link = rows[2].querySelector('a');
    if (link) link.classList.add('insight-view-all');
  }
}
