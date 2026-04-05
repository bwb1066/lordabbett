const ARROW_SVG = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" aria-hidden="true" height="1em" width="1em"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>';

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // Row 0: heading
  rows[0].classList.add('additional-info-heading');

  // Row 1: contains table or nested block with links
  // Find all links in the second row regardless of nesting
  const tableRow = rows[1];
  const allLinks = [...tableRow.querySelectorAll('a')];

  if (allLinks.length === 0) return;

  // Split links into two columns (first half / second half)
  const mid = Math.ceil(allLinks.length / 2);
  const col1Links = allLinks.slice(0, mid);
  const col2Links = allLinks.slice(mid);

  // Build grid
  const grid = document.createElement('div');
  grid.className = 'additional-info-grid';

  [col1Links, col2Links].forEach((links) => {
    const col = document.createElement('div');
    col.className = 'additional-info-col';
    links.forEach((a) => {
      const item = document.createElement('a');
      item.href = a.href;
      item.className = 'additional-info-link';
      item.innerHTML = `<span class="additional-info-arrow">${ARROW_SVG}</span>${a.textContent}`;
      col.append(item);
    });
    grid.append(col);
  });

  tableRow.remove();
  block.append(grid);
}
