import { Fragment, type ReactNode } from 'react';
import { RuleType, type MarkdownToJSX } from 'markdown-to-jsx/react';
import Citation from './Citation';

type Source = { metadata: { url?: string } };

/** Render references after Markdown parsing, without rewriting code or links. */
export function createCitationRenderRule(
  sources: Source[],
  onOpenFile: (url: string) => void,
): NonNullable<MarkdownToJSX.Options['renderRule']> {
  let literalDepth = 0;
  return (next, node, _renderChildren, state) => {
    const literalContainer =
      node.type === RuleType.link ||
      node.type === RuleType.ref ||
      ('tag' in node && ['a', 'code', 'pre'].includes(node.tag));
    if (literalContainer) {
      literalDepth++;
      try {
        return next();
      } finally {
        literalDepth--;
      }
    }
    if (node.type !== RuleType.text || literalDepth || !sources.length)
      return next();

    const parts: ReactNode[] = [];
    let offset = 0;
    for (const match of node.text.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) {
      parts.push(node.text.slice(offset, match.index));
      const numbers = match[1].split(',').map((value) => value.trim());
      if (!numbers.some((value) => sources[Number(value) - 1]?.metadata.url)) {
        parts.push(match[0]);
      } else {
        numbers.forEach((value, index) => {
          const href = sources[Number(value) - 1]?.metadata.url;
          parts.push(
            href ? (
              <Citation
                key={`${match.index}-${index}`}
                href={href}
                onOpenFile={onOpenFile}
              >
                {value}
              </Citation>
            ) : (
              `[${value}]`
            ),
          );
        });
      }
      offset = match.index + match[0].length;
    }
    if (!offset) return next();
    parts.push(node.text.slice(offset));
    return <Fragment key={state.key}>{parts}</Fragment>;
  };
}
