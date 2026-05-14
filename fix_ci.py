import sys

with open('src/utils/gameStateUtils.ts', 'r') as f:
    content = f.read()

# 1. Remove malformed clampBandHarmony block
bad_block = """/**
 * Clamps band harmony = (harmony: number): number => {
  if (!Number.isFinite(harmony)) return 1
  const safeHarmony = Math.floor(harmony)
  return Math.max(1, Math.min(100, safeHarmony))
}"""

content = content.replace(bad_block, "")

# 2. Update JSDoc for clampRelationship
bad_jsdoc = """/**
 * Clamps band harmony to the canonical gameplay range.
 *
 * @param {number} harmony - Candidate harmony value.
 * @returns {number} Clamped harmony value in range [1, 100].
 */
export const clampRelationship"""

good_jsdoc = """/**
 * Clamps relationship score to the canonical gameplay range.
 *
 * @param {number} score - Candidate relationship score.
 * @returns {number} Clamped relationship value in range [0, 100].
 */
export const clampRelationship"""

content = content.replace(bad_jsdoc, good_jsdoc)


# 3. Optimize banterEvents assignment
bad_banter_code = """    if (relationshipChange.length > 0) {
      for (let i = 0; i < relationshipChange.length; i++) {
        const rc = relationshipChange[i] as RelationshipChange
        if (rc.source === 'banter') {
          nextBand.banterEvents = [
            ...(nextBand.banterEvents || []),
            {
              member1: rc.member1,
              member2: rc.member2,
              delta: rc.change,
              timestamp: rc.timestamp || Date.now()
            }
          ]
        }
      }
    }"""

good_banter_code = """    if (relationshipChange.length > 0) {
      const banterDeltas = relationshipChange.filter(rc => rc.source === 'banter')
      if (banterDeltas.length > 0) {
        nextBand.banterEvents = [
          ...(nextBand.banterEvents || []),
          ...banterDeltas.map(rc => ({
            member1: rc.member1,
            member2: rc.member2,
            delta: rc.change,
            timestamp: rc.timestamp || Date.now()
          }))
        ]
      }
    }"""

content = content.replace(bad_banter_code, good_banter_code)

with open('src/utils/gameStateUtils.ts', 'w') as f:
    f.write(content)
