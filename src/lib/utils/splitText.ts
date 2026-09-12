import { getEncoding } from 'js-tiktoken';

const splitRegex = /(?<=\. |\n|! |\? |; |:\s|\d+\.\s|- |\* )/g;

const enc = getEncoding('cl100k_base');

export const getTokenCount = (text: string): number => {
  try {
    return enc.encode(text).length;
  } catch {
    return Math.ceil(text.length / 4);
  }
};

export const splitText = (
  text: string,
  maxTokens = 512,
  overlapTokens = 64,
): string[] => {
  const segments = text
    .split(splitRegex)
    .filter(Boolean)
    .flatMap((segment) => {
      if (segment.length <= maxTokens && getTokenCount(segment) <= maxTokens)
        return [segment];
      // A paragraph can be longer than the chunk budget. Split it first so the
      // packing loop always advances, keeping complete Unicode characters.
      const characters = Array.from(segment);
      const pieces: string[] = [];
      let start = 0;
      while (start < characters.length) {
        let low = start + 1;
        let high = Math.min(characters.length, start + maxTokens);
        let end = low;
        while (low <= high) {
          const middle = Math.floor((low + high) / 2);
          if (
            getTokenCount(characters.slice(start, middle).join('')) <= maxTokens
          ) {
            end = middle;
            low = middle + 1;
          } else high = middle - 1;
        }
        pieces.push(characters.slice(start, end).join(''));
        start = end;
      }
      return pieces;
    });

  if (segments.length === 0) {
    return [];
  }

  const segmentTokenCounts = segments.map(getTokenCount);

  const result: string[] = [];

  let chunkStart = 0;

  while (chunkStart < segments.length) {
    let chunkEnd = chunkStart;
    let currentTokenCount = 0;

    while (chunkEnd < segments.length && currentTokenCount < maxTokens) {
      if (
        chunkEnd > chunkStart &&
        currentTokenCount + segmentTokenCounts[chunkEnd] > maxTokens
      ) {
        break;
      }

      currentTokenCount += segmentTokenCounts[chunkEnd];
      chunkEnd++;
    }

    let overlapBeforeStart = Math.max(0, chunkStart - 1);
    let overlapBeforeTokenCount = 0;

    while (overlapBeforeStart >= 0 && overlapBeforeTokenCount < overlapTokens) {
      if (
        overlapBeforeTokenCount + segmentTokenCounts[overlapBeforeStart] >
        overlapTokens
      ) {
        break;
      }

      overlapBeforeTokenCount += segmentTokenCounts[overlapBeforeStart];
      overlapBeforeStart--;
    }

    const overlapStartIndex = Math.max(0, overlapBeforeStart + 1);

    const overlapBeforeContent = segments
      .slice(overlapStartIndex, chunkStart)
      .join('');

    const chunkContent = segments.slice(chunkStart, chunkEnd).join('');

    result.push(overlapBeforeContent + chunkContent);

    chunkStart = chunkEnd;
  }

  return result;
};
