import { Project, SyntaxKind } from 'ts-morph'
import * as child_process from 'child_process'
import * as fs from 'fs'

child_process.execSync(
  'npx tsc --noEmit -p jsconfig.checkjs.json > tsc_errors.log 2>&1 || true'
)
const log = fs.readFileSync('tsc_errors.log', 'utf-8')
const lines = log.split('\n')

const project = new Project({
  tsConfigFilePath: 'tsconfig.json'
})

let modCount = 0
const handledErrors = new Set()

for (const line of lines) {
  const match = line.match(
    /^([a-zA-Z0-9_/\.-]+)\((\d+),(\d+)\): error (TS18048|TS2538|TS2339|TS2345|TS2532|TS7053|TS2322|TS18046|TS2554): (.+)/
  )
  if (match) {
    const file = match[1]
    const row = parseInt(match[2], 10)
    const col = parseInt(match[3], 10)
    const code = match[4]

    const errKey = `${file}:${row}:${col}`
    if (handledErrors.has(errKey)) continue
    handledErrors.add(errKey)

    const sourceFile =
      project.getSourceFile(file) || project.addSourceFileAtPath(file)
    if (!sourceFile) continue

    let found = false

    const text = sourceFile.getFullText()
    let currentLine = 1
    let lineStart = 0
    for (let i = 0; i < text.length; i++) {
      if (currentLine === row) {
        lineStart = i
        break
      }
      if (text[i] === '\n') {
        currentLine++
      }
    }

    const targetPos = lineStart + col - 1
    const node = sourceFile.getDescendantAtPos(targetPos)

    if (node) {
      // For TS18046 (unknown) and TS18048 (possibly undefined), we can use optional chaining or cast
      if (code === 'TS18046' || code === 'TS18048' || code === 'TS2339') {
        // Usually this is a property access or element access
        const pae = node.getFirstAncestorByKind(
          SyntaxKind.PropertyAccessExpression
        )
        if (pae) {
          const expr = pae.getExpression()
          if (expr && expr.getText() !== 'import.meta') {
            expr.replaceWithText(`(${expr.getText()} as any)`)
            found = true
            modCount++
          }
        } else if (
          node.getKind() === SyntaxKind.Identifier &&
          node.getText() !== 'import'
        ) {
          node.replaceWithText(`(${node.getText()} as any)`)
          found = true
          modCount++
        }
      } else if (code === 'TS2538') {
        // undefined cannot be used as index
        const elemAccess = node.getFirstAncestorByKind(
          SyntaxKind.ElementAccessExpression
        )
        if (elemAccess) {
          const argExpr = elemAccess.getArgumentExpression()
          if (argExpr) {
            argExpr.replaceWithText(`(${argExpr.getText()} as string)`)
            found = true
            modCount++
          }
        }
      }
    }

    if (found) {
      try {
        sourceFile.saveSync()
      } catch (e) {}
    }
  }
}
console.log(`Modified ${modCount} nodes.`)
