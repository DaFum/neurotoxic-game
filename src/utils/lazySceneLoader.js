/**
 * Builds a React.lazy-compatible loader for named exports.
 *
 * @param {Function} importer - Dynamic import callback.
 * @param {string} exportName - Named export to resolve as default.
 * @returns {Function} Lazy-loader function returning a default export object.
 */
export const createNamedLazyLoader = (importer, exportName) => {
  return () =>
    importer().then(moduleExports => ({ default: moduleExports[exportName] }))
}
