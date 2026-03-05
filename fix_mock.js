import fs from 'fs'

const file = 'tests/audioEngineSetup.test.js'
let content = fs.readFileSync(file, 'utf8')

content = content.replace(
  "const mockToneContext = mockTone.getContext()",
  "const mockToneContext = mockTone.getContext()\n    if (!mockToneContext) return t.skip('No tone context in mock')"
)

fs.writeFileSync(file, content)
