import fs from 'fs'

const replaceInFile = (file, from, to) => {
  const content = fs.readFileSync(file, 'utf8')
  fs.writeFileSync(file, content.replace(from, to))
}

replaceInFile('tests/audioEnginePlaybackWindow.test.js', /\(val, time\) =>/g, '(val) =>')
replaceInFile('tests/audioPlaybackUtils.test.js', 'let originalImportMeta', '// let originalImportMeta')
replaceInFile('tests/errorHandler.test.js', 'let dispatchEvent = null', '// let dispatchEvent = null')
replaceInFile('tests/errorHandler.test.js', 'dispatchEvent = evt', '// dispatchEvent = evt')
replaceInFile('tests/imageGen.test.js', "import { test, mock }", "import { test }")
