type LiteralToken = {
  type: 'literal';
  value: string;
};

type SlotToken = {
  type: 'slot';
  pattern: RegExp;
};

export type Mask = ReadonlyArray<LiteralToken | SlotToken>;

const maxMaskLength = 200;
const escapedLiterals = new Set('^$\\.*+?()[]{}|/-'.split(''));
const escapedControlCharacters: Record<string, string> = {
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
};

type ParsedToken = {
  token: LiteralToken | SlotToken;
  end: number;
};

function withoutStatefulFlags(flags: string): string {
  return flags.replaceAll(/[gy]/g, '');
}

function isEscaped(source: string, index: number): boolean {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && source[i] === '\\'; i--) {
    slashCount++;
  }

  return slashCount % 2 === 1;
}

function stripAnchors(source: string): string {
  let normalizedSource = source;
  if (normalizedSource.startsWith('^')) {
    normalizedSource = normalizedSource.slice(1);
  }

  if (
    normalizedSource.endsWith('$') &&
    !isEscaped(normalizedSource, normalizedSource.length - 1)
  ) {
    normalizedSource = normalizedSource.slice(0, -1);
  }

  return normalizedSource;
}

function slot(pattern: string, flags: string): SlotToken | undefined {
  try {
    return { type: 'slot', pattern: new RegExp(`^${pattern}$`, flags) };
  } catch {
    return undefined;
  }
}

function parseEscape(
  source: string,
  index: number,
  flags: string,
): ParsedToken | undefined {
  const escaped = source[index + 1];
  if (!escaped) {
    return undefined;
  }

  if ('dDwWsS'.includes(escaped)) {
    const token = slot(`\\${escaped}`, flags);
    return token ? { token, end: index + 2 } : undefined;
  }

  const escapedControlCharacter = escapedControlCharacters[escaped];
  if (escapedControlCharacter) {
    return {
      token: { type: 'literal', value: escapedControlCharacter },
      end: index + 2,
    };
  }

  if (escapedLiterals.has(escaped)) {
    return { token: { type: 'literal', value: escaped }, end: index + 2 };
  }

  return undefined;
}

function parseCharacterClass(
  source: string,
  index: number,
  flags: string,
): ParsedToken | undefined {
  for (let i = index + 1; i < source.length; i++) {
    if (source[i] === '\\') {
      i++;
      continue;
    }

    if (source[i] === ']') {
      const pattern = source.slice(index, i + 1);
      const token = slot(pattern, flags);
      return token ? { token, end: i + 1 } : undefined;
    }
  }

  return undefined;
}

function parseToken(
  source: string,
  index: number,
  flags: string,
): ParsedToken | undefined {
  const char = source[index];
  if (!char) {
    return undefined;
  }

  if (char === '\\') {
    return parseEscape(source, index, flags);
  }

  if (char === '[') {
    return parseCharacterClass(source, index, flags);
  }

  if (char === '.') {
    const token = slot('.', flags);
    return token ? { token, end: index + 1 } : undefined;
  }

  if ('*+?{}()|^$'.includes(char)) {
    return undefined;
  }

  return { token: { type: 'literal', value: char }, end: index + 1 };
}

function parseExactQuantifier(
  source: string,
  index: number,
): { count: number; end: number } | undefined {
  const char = source[index];
  if (!char) {
    return { count: 1, end: index };
  }

  if ('*+?'.includes(char)) {
    return undefined;
  }

  if (char !== '{') {
    return { count: 1, end: index };
  }

  const quantifierEnd = source.indexOf('}', index + 1);
  if (quantifierEnd === -1) {
    return undefined;
  }

  const countSource = source.slice(index + 1, quantifierEnd);
  if (!/^\d+$/.test(countSource)) {
    return undefined;
  }

  const count = Number(countSource);
  if (!Number.isInteger(count)) {
    return undefined;
  }

  return { count, end: quantifierEnd + 1 };
}

export function inferMask(pattern: RegExp): Mask | undefined {
  const flags = withoutStatefulFlags(pattern.flags);
  const source = stripAnchors(pattern.source);
  const tokens: Array<LiteralToken | SlotToken> = [];

  for (let index = 0; index < source.length; ) {
    const parsedToken = parseToken(source, index, flags);
    if (!parsedToken) {
      return undefined;
    }

    const quantifier = parseExactQuantifier(source, parsedToken.end);
    if (!quantifier || tokens.length + quantifier.count > maxMaskLength) {
      return undefined;
    }

    for (let count = 0; count < quantifier.count; count++) {
      tokens.push(parsedToken.token);
    }

    index = quantifier.end;
  }

  if (!tokens.some((token) => token.type === 'slot')) {
    return undefined;
  }

  return tokens;
}

function readSlotValues(input: string, mask: Mask): string[] {
  const values: string[] = [];
  let tokenIndex = 0;

  inputLoop: for (const char of input) {
    while (tokenIndex < mask.length) {
      const token = mask[tokenIndex];
      if (token?.type !== 'literal') {
        break;
      }

      if (token.value === char) {
        tokenIndex++;
        continue inputLoop;
      }

      tokenIndex++;
    }

    const token = mask[tokenIndex];
    if (!token) {
      break;
    }

    if (token.type === 'slot' && token.pattern.test(char)) {
      values.push(char);
      tokenIndex++;
    }
  }

  return values;
}

function formatSlotValues(values: ReadonlyArray<string>, mask: Mask): string {
  let valueIndex = 0;
  let output = '';

  for (const token of mask) {
    if (token.type === 'literal') {
      if (valueIndex >= values.length) {
        break;
      }

      output += token.value;
      continue;
    }

    const value = values[valueIndex];
    if (!value) {
      break;
    }

    output += value;
    valueIndex++;
  }

  return output;
}

function formatDisplayValue(values: ReadonlyArray<string>, mask: Mask): string {
  let valueIndex = 0;
  let output = '';

  for (const token of mask) {
    if (token.type === 'literal') {
      output += token.value;
      continue;
    }

    output += values[valueIndex] ?? '_';
    valueIndex++;
  }

  return output;
}

function formatCursorValue(values: ReadonlyArray<string>, mask: Mask): string {
  let valueIndex = 0;
  let output = '';

  for (const token of mask) {
    if (token.type === 'literal') {
      if (values.length === 0) {
        break;
      }

      output += token.value;
      continue;
    }

    const value = values[valueIndex];
    if (!value) {
      break;
    }

    output += value;
    valueIndex++;
  }

  return output;
}

export function applyMask(
  input: string,
  mask: Mask | undefined,
  cursor: number = input.length,
): { value: string; displayValue: string; cursor: number } {
  if (!mask) {
    return { value: input, displayValue: input, cursor };
  }

  const inputBeforeCursor = input.slice(0, cursor);
  const values = readSlotValues(input, mask);
  const cursorValues = readSlotValues(inputBeforeCursor, mask);

  return {
    value: formatSlotValues(values, mask),
    displayValue: formatDisplayValue(values, mask),
    cursor: formatCursorValue(cursorValues, mask).length,
  };
}
