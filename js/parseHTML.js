export function parseHTML(html) {
  const t = document.createElement('template');
  t.innerHTML = html; 
  return t.content;
}

