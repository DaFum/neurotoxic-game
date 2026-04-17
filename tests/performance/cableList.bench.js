import React from 'react'
import { renderToString } from 'react-dom/server'
import { CableList } from '../../src/scenes/kabelsalat/components/CableList.tsx'
import { performance } from 'perf_hooks'

const connections = {
  socket1: 'midi',
  socket2: 'iec',
  socket3: 'jack',
  socket4: 'xlr',
  socket5: 'dc'
}

const props = {
  t: key => key,
  connections,
  selectedCable: 'midi',
  isShocked: false,
  isGameOver: false,
  handleCableClick: () => {}
}

const iterations = 50000

// Warmup
for (let i = 0; i < 1000; i++) {
  renderToString(React.createElement(CableList, props))
}

const start = performance.now()
for (let i = 0; i < iterations; i++) {
  renderToString(React.createElement(CableList, props))
}
const end = performance.now()

console.log(
  `CableList render Baseline: ${(end - start).toFixed(2)} ms for ${iterations} iterations`
)
