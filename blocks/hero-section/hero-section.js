export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const [textCol, imgCol] = [...row.children];

  if (textCol) textCol.classList.add('hero-section-text');
  if (imgCol) {
    imgCol.classList.add('hero-section-image');
    // Move image out of the row to be a direct child of block for absolute positioning
    block.append(imgCol);
  }

  // Clean button decoration from CTA
  textCol?.querySelectorAll('a').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary');
    const bc = a.closest('.button-container');
    if (bc) bc.style.display = 'inline';
  });
}
