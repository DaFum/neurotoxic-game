import assert from 'node:assert/strict'
import test from 'node:test'
import { eventEngine } from '../../src/utils/eventEngine'

const pool = [
  {
    id: 'venue_template_probe',
    category: 'band',
    trigger: 'random',
    chance: 1,
    title: 'Trouble at {venue}',
    description: 'events:probe.desc',
    options: [{ label: 'ok', effect: { type: 'stat', stat: 'time', value: 0 } }]
  }
]

const select = location =>
  eventEngine.selectEvent(
    pool,
    {
      player: { day: 1, money: 100, location },
      band: { harmony: 50, members: [] },
      social: {}
    },
    'random',
    () => 0
  )

test('event venue context passes the location key through for the modal to translate', () => {
  const event = select('venues:stendal_adler.name')
  assert.ok(event, 'event should be selected')
  assert.equal(event.context.venue, 'venues:stendal_adler.name')
  assert.equal(event.title, 'Trouble at venues:stendal_adler.name')
})

test('event venue context falls back to a locale key, not an English literal', () => {
  for (const location of [undefined, null, '']) {
    const event = select(location)
    assert.ok(event, `event should be selected for ${String(location)}`)
    assert.equal(event.context.venue, 'ui:event.venueFallback')
  }
})
