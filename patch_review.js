import fs from 'fs'

let content = fs.readFileSync('src/utils/assetSelectors.ts', 'utf8')

const newCode = `
export const selectAssetsMap = (
  state: Pick<GameState, 'assets'>
): ReadonlyMap<string, LongTermAsset> => {
  const assets = state.assets || EMPTY_ASSETS
  if (assets !== lastAssetsForMap || !assetsMapCache) {
    lastAssetsForMap = assets
    const map = new Map<string, LongTermAsset>()
    for (const a of assets) {
      if (!map.has(a.id)) {
        map.set(a.id, a)
      }
    }
    assetsMapCache = map
  }
  return assetsMapCache
}`

content = content.replace(
  `export const selectAssetsMap = (
  state: Pick<GameState, 'assets'>
): Map<string, LongTermAsset> => {
  const assets = state.assets || EMPTY_ASSETS
  if (assets !== lastAssetsForMap || !assetsMapCache) {
    lastAssetsForMap = assets
    const map = new Map<string, LongTermAsset>()
    for (const a of assets) {
      map.set(a.id, a)
    }
    assetsMapCache = map
  }
  return assetsMapCache
}`,
  newCode.trim()
)

fs.writeFileSync('src/utils/assetSelectors.ts', content)
