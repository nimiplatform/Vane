import { compiler, RuleType } from 'markdown-to-jsx/html';

/** Plain PDF text follows parsed Markdown, preserving literal code and links' labels. */
export function markdownExportText(markdown: string): string {
  const html = compiler(markdown, {
    disableParsingRawHTML: true,
    renderRule: (next, node) => node.type === RuleType.image ? '' : next(),
  });
  const document = new DOMParser().parseFromString(html, 'text/html');
  for (const br of document.querySelectorAll('br')) br.replaceWith('\n');
  for (const block of document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre, tr, blockquote')) block.append('\n');
  return (document.body.textContent || '').trim();
}
