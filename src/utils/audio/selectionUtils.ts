// Back-compat barrel: `selectRandomItem` moved to the general-purpose
// `src/utils/selectionUtils.ts`. Existing imports (and node:test module
// mocks) keep targeting this path.
export { selectRandomItem } from '../selectionUtils'
