import fs from 'fs'

const replaceInFile = (file, from, to) => {
  const content = fs.readFileSync(file, 'utf8')
  fs.writeFileSync(file, content.replace(from, to))
}

replaceInFile('tests/errorHandler.test.js', 'dispatchEvent: (evt) => {', 'dispatchEvent: () => {')
