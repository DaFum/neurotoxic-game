import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildSetlistChartDensity,
  buildSongChartDensity
} from '../../src/utils/chartDensity'

test('buildSongChartDensity buckets valid song notes through MIDI events', () => {
  const bars = buildSongChartDensity(
    {
      tpb: 480,
      bpm: 120,
      duration: 4,
      notes: [
        { t: 0, p: 60, v: 100 },
        { t: 240, p: 62, v: 100 },
        { t: 960, p: 64, v: 100 },
        { t: 960, p: 140, v: 100 },
        { t: '240', p: 62, v: 100 },
        { t: -1, p: 64, v: 100 }
      ]
    },
    4
  )

  assert.deepEqual(
    bars.map(bar => bar.count),
    [2, 1, 0, 0]
  )
  assert.deepEqual(
    bars.map(bar => bar.intensity),
    [1, 0.5, 0, 0]
  )
  assert.deepEqual(
    bars.map(bar => bar.timestamp),
    [0, 1, 2, 3]
  )
})

test('buildSetlistChartDensity aggregates selected song density', () => {
  const bars = buildSetlistChartDensity(
    [
      {
        tpb: 480,
        bpm: 120,
        duration: 4,
        notes: [
          { t: 0, p: 60, v: 100 },
          { t: 960, p: 62, v: 100 }
        ]
      },
      {
        tpb: 480,
        bpm: 120,
        duration: 4,
        notes: [
          { t: 0, p: 64, v: 100 },
          { t: 480, p: 65, v: 100 }
        ]
      }
    ],
    4
  )

  assert.deepEqual(
    bars.map(bar => bar.count),
    [3, 1, 0, 0]
  )
  assert.deepEqual(
    bars.map(bar => bar.intensity),
    [1, 1 / 3, 0, 0]
  )
})
