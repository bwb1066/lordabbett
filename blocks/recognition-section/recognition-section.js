export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cols = [...row.children];
  if (cols.length >= 2) {
    cols[0].classList.add('recognition-text');
    cols[1].classList.add('recognition-image');
  }

  // Clean button decoration from CTA
  block.querySelectorAll('a').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary');
    const bc = a.closest('.button-container');
    if (bc) bc.classList.remove('button-container');
  });
}
