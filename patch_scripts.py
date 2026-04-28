import re

with open('scripts/run-tests.mjs', 'r') as f:
    content = f.read()

content = content.replace("runScript('test:vitest')", "runScript('test:vitest:logic')")

with open('scripts/run-tests.mjs', 'w') as f:
    f.write(content)

with open('package.json', 'r') as f:
    package = f.read()

package = package.replace('"test": "node ./scripts/run-tests.mjs",', '"test": "pnpm run test:fast",\n    "test:fast": "node ./scripts/run-fast-tests.mjs",')
package = package.replace('"test:all": "pnpm run test && pnpm run test:ui && pnpm run test:vitest:logic",', '"test:all": "pnpm run test:node && pnpm run test:vitest:logic && pnpm run test:ui && pnpm run test:locale:smoke && pnpm run test:perf",')

with open('package.json', 'w') as f:
    f.write(package)

with open('.github/workflows/test.yml', 'r') as f:
    yml = f.read()

yml = yml.replace('''      - name: Run Vitest suite
        id: run-vitest
        shell: bash
        run: |
          rc=0
          pnpm test:ui 2>&1 | tee test-output-vitest.txt || rc=$?
          echo "exit_code=$rc" >> "$GITHUB_OUTPUT"

      - name: Upload test log artifact (vitest)
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: test-output-vitest
          path: test-output-vitest.txt

      - name: Comment failed tests on PR (vitest) — update existing sticky comment
        if: ${{ always() && steps.run-vitest.outputs.exit_code != '0' && github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository }}
        uses: ./.github/actions/post-test-failure-comment
        with:
          marker: '<!-- test-results-vitest: do-not-edit -->'
          file: 'test-output-vitest.txt'
          regex: 'FAIL\\b|^\\s+[✕×✗]|AssertionError|Error:'
          max: ${{ env.MAX_FAILURE_LINES }}
          header: '## ❌ Vitest tests failed'

      - name: Fail if tests failed
        if: ${{ always() && steps.run-vitest.outputs.exit_code != '0' }}
        run: exit 1''', '''      - name: Run Vitest Logic suite
        id: run-vitest-logic
        shell: bash
        run: |
          rc=0
          pnpm run test:vitest:logic 2>&1 | tee test-output-vitest-logic.txt || rc=$?
          echo "exit_code=$rc" >> "$GITHUB_OUTPUT"

      - name: Upload test log artifact (vitest-logic)
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: test-output-vitest-logic
          path: test-output-vitest-logic.txt

      - name: Fail if tests failed
        if: ${{ always() && steps.run-vitest-logic.outputs.exit_code != '0' }}
        run: exit 1

  vitest-ui:
    name: Vitest UI
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout repository (merge ref)
        uses: actions/checkout@v6

      - name: Install pnpm
        uses: pnpm/action-setup@v6
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Use Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '22.13.0'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile --ignore-scripts

      - name: Run Vitest UI suite
        id: run-vitest-ui
        shell: bash
        run: |
          rc=0
          pnpm run test:ui 2>&1 | tee test-output-vitest-ui.txt || rc=$?
          echo "exit_code=$rc" >> "$GITHUB_OUTPUT"

      - name: Upload test log artifact (vitest-ui)
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: test-output-vitest-ui
          path: test-output-vitest-ui.txt

      - name: Fail if tests failed
        if: ${{ always() && steps.run-vitest-ui.outputs.exit_code != '0' }}
        run: exit 1''')

yml = yml.replace('vitest:', 'vitest-logic:')
yml = yml.replace('name: Vitest\n', 'name: Vitest Logic\n')

with open('.github/workflows/test.yml', 'w') as f:
    f.write(yml)
