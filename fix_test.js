import fs from 'fs'

const file = 'tests/rhythmUtils.test.js'
let content = fs.readFileSync(file, 'utf8')

content = content.replace("  describe('checkHit', () => {\n  describe('checkHit', () => {", "  describe('checkHit', () => {")

fs.writeFileSync(file, content)
