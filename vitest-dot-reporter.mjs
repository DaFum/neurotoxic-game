import { stdout } from 'node:process'

export default class VitestDotReporter {
  onTestCaseResult(testCase) {
    const symbol = testCase.result().state === 'passed' ? '.' : 'X'
    stdout.write(`${testCase.fullName} ${symbol}\n`)
  }
}
