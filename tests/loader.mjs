export async function load(url, context, nextLoad) {
  // Delegate to next loader first
  const result = await nextLoad(url, context);

  // Only process if we have source code
  if (result.source && typeof result.source === 'string' || result.source instanceof Buffer) {
    const source = result.source.toString();

    // Check for import.meta.glob usage
    if (source.includes('import.meta.glob')) {
      // Replace import.meta.glob(...) with empty object literal ({})
      // Using 's' flag (dotAll) for multi-line support
      const transformed = source.replace(
        /import\.meta\.glob\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/gs,
        '({})'
      );

      return {
        ...result,
        source: transformed,
      };
    }
  }

  return result;
}
