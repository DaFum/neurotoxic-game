import { describe, it } from 'node:test'
import assert from 'node:assert'
import { buildQuestsProps } from '../../src/hooks/useQuestsModal.js'

describe('buildQuestsProps', () => {
  it('should build props with provided values', () => {
    const onClose = () => {}
    const activeQuests = [
      { id: 'q1', label: 'Quest 1' },
      { id: 'q2', label: 'Quest 2' }
    ]
    const player = { id: 1 }

    const props = buildQuestsProps(onClose, activeQuests, player)

    assert.strictEqual(props.onClose, onClose)
    assert.deepStrictEqual(props.activeQuests, activeQuests)
    assert.deepStrictEqual(props.player, player)
  })

  it('should default activeQuests to an empty array if falsy', () => {
    const onClose = () => {}
    const player = { id: 1 }

    const props = buildQuestsProps(onClose, undefined, player)

    assert.deepStrictEqual(props.activeQuests, [])
  })

  it('should default activeQuests to an empty array if null', () => {
    const onClose = () => {}
    const player = { id: 1 }

    const props = buildQuestsProps(onClose, null, player)

    assert.deepStrictEqual(props.activeQuests, [])
  })
})
