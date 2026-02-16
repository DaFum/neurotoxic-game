export async function load(url, context, nextLoad) {
  // Delegate to next loader first
  const result = await nextLoad(url, context);

  // Only process if we have source code
  // Fix operator precedence: check existence first, then check type
  if (result.source && (typeof result.source === 'string' || result.source instanceof Buffer)) {
    const source = result.source.toString();

    // Check for import.meta.glob usage
    if (source.includes('import.meta.glob')) {
      const transformed = replaceImportMetaGlob(source);

      return {
        ...result,
        source: transformed,
      };
    }
  }

  return result;
}

/**
 * Replaces import.meta.glob(...) calls with ({}) using a balanced parenthesis parser.
 * This avoids ReDoS risks associated with complex regular expressions.
 * Enhanced to skip string literals so parentheses inside strings (e.g. glob patterns) are not counted.
 */
function replaceImportMetaGlob(source) {
  const token = 'import.meta.glob';
  let result = '';
  let currentIndex = 0;

  while (currentIndex < source.length) {
    const tokenIndex = source.indexOf(token, currentIndex);
    if (tokenIndex === -1) {
      result += source.slice(currentIndex);
      break;
    }

    // Append text before the token
    result += source.slice(currentIndex, tokenIndex);

    // Look for opening parenthesis
    const openParenIndex = source.indexOf('(', tokenIndex + token.length);

    // If no opening parenthesis found, just copy the token and continue
    if (openParenIndex === -1) {
       result += source.slice(tokenIndex, tokenIndex + token.length);
       currentIndex = tokenIndex + token.length;
       continue;
    }

    // Check if there are only whitespace between token and (
    const between = source.slice(tokenIndex + token.length, openParenIndex);
    if (between.trim() !== '') {
        // Not a direct call (e.g. might be part of a larger property access), skip
        result += source.slice(tokenIndex, tokenIndex + token.length);
        currentIndex = tokenIndex + token.length;
        continue;
    }

    // Find balancing closing parenthesis
    let depth = 1;
    let i = openParenIndex + 1;
    let found = false;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (i < source.length) {
      const char = source[i];
      const prevChar = i > 0 ? source[i - 1] : '';

      // Handle string literals and template literals
      if (char === "'" && !inDoubleQuote && !inBacktick && prevChar !== '\\') {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && !inSingleQuote && !inBacktick && prevChar !== '\\') {
        inDoubleQuote = !inDoubleQuote;
      } else if (char === '`' && !inSingleQuote && !inDoubleQuote && prevChar !== '\\') {
        inBacktick = !inBacktick;
      }

      // Only count parentheses if not inside a string
      if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            found = true;
            break;
          }
        }
      }
      i++;
    }

    if (found) {
      // Replace the whole call `import.meta.glob(...)` with `({})`
      result += '({})';
      currentIndex = i + 1; // i is index of closing ')', so next start is i + 1
    } else {
      // Malformed or unclosed, just skip the token and continue
      result += source.slice(tokenIndex, tokenIndex + token.length);
      currentIndex = tokenIndex + token.length;
    }
  }
  return result;
}
