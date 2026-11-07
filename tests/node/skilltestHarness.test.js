import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { existsSync, chmodSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

const repoRoot = process.cwd()

const EXPECTED_EXPORTS = [
  'buildReport',
  'collectSkillRoots',
  'discoverSkills',
  'findRepoRoot',
  'findSkillDirs',
  'formatSummary',
  'getTreeName',
  'loadSkillCases',
  'loadSkillRecord',
  'parseFrontmatter',
  'parseYaml',
  'readDisabledSkills',
  'resetRepoRootCache',
  'runPromptCases',
  'runQualityGate',
  'runReporting',
  'validateLinks',
  'validateOpenAIYaml',
  'validateScripts',
  'writeReport'
].sort()

const TREES = [
  {
    name: '.agents',
    libPath: path.join(
      repoRoot,
      '.agents/skills/skilltest/scripts/skilltest-lib.mjs'
    ),
    runnerPath: path.join(
      repoRoot,
      '.agents/skills/skilltest/scripts/skilltest.mjs'
    ),
    validatorPath: path.join(
      repoRoot,
      '.agents/skills/skilltest/scripts/validate-skills.mjs'
    ),
    cliValidatorPath: path.join(
      repoRoot,
      '.agents/skills/skilltest/scripts/validate-skills-cli.mjs'
    ),
    deprecationText:
      'Deprecated: use ".agents/skills/skilltest/scripts/skilltest.mjs" instead.',
    expectedSkipGateCode: 1, // Pre-existing failures in .agents, pinned below
    // The .agents react-performance-optimization frontmatter is not valid YAML
    expectedFailingSkillDirs: ['react-performance-optimization'],
    expectedPromptFailures: [
      'webaudio-reliability-fixer missing expected snippets: AudioManager.ts, useRhythmGameAudio.ts',
      'ci-hardener missing expected snippets: lint',
      'skill-qa-harness missing expected snippets: Validate skills, Run tests',
      'tailwind-v4-css-variables-enforcer missing expected snippets: CSS Variables'
    ]
  },
  {
    name: '.claude',
    libPath: path.join(
      repoRoot,
      '.claude/skills/skilltest/scripts/skilltest-lib.mjs'
    ),
    runnerPath: path.join(
      repoRoot,
      '.claude/skills/skilltest/scripts/skilltest.mjs'
    ),
    validatorPath: path.join(
      repoRoot,
      '.claude/skills/skilltest/scripts/validate-skills.mjs'
    ),
    cliValidatorPath: path.join(
      repoRoot,
      '.claude/skills/skilltest/scripts/validate-skills-cli.mjs'
    ),
    deprecationText:
      'Deprecated: use ".claude/skills/skilltest/scripts/skilltest.mjs" instead.',
    expectedSkipGateCode: 0, // .claude matches its cases cleanly
    expectedFailingSkillDirs: [],
    expectedPromptFailures: []
  }
]

/**
 * Run a command in a child process with explicit isolated environment variables.
 */
const runSubprocess = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || repoRoot,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'test',
        HOME: options.HOME || repoRoot,
        USERPROFILE: options.USERPROFILE || options.HOME || repoRoot,
        CODEX_HOME: options.CODEX_HOME || '',
        ...options.env
      },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', data => {
      stdout += data.toString()
    })
    child.stderr.on('data', data => {
      stderr += data.toString()
    })

    child.on('error', reject)
    child.on('close', (code, signal) => {
      resolve({ code, signal, stdout, stderr })
    })
  })
}

/**
 * Read the skilltest report written under a repository root.
 */
const readReportAt = async root =>
  JSON.parse(
    await fs.readFile(
      path.join(root, 'reports', 'skills', 'skilltest-report.json'),
      'utf8'
    )
  )

/**
 * Initialize a temporary git repository fixture.
 */
const createTempGitRepo = async t => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skilltest-git-'))
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  // Never act on an outer repository: the directory must be inside the OS
  // temp dir and no inherited GIT_* variable (GIT_DIR in a hook) may leak in.
  assert.ok(
    path.resolve(tempDir).startsWith(path.resolve(os.tmpdir())),
    `temp repo ${tempDir} is outside ${os.tmpdir()}`
  )
  const gitEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))
  )

  const git = args => {
    const res = spawnSync('git', args, {
      cwd: tempDir,
      env: gitEnv,
      encoding: 'utf8',
      timeout: 10000
    })
    assert.equal(res.status, 0, `git ${args.join(' ')} failed: ${res.stderr}`)
  }

  git(['init'])
  git(['config', 'user.name', 'Test User'])
  git(['config', 'user.email', 'test@example.com'])
  return tempDir
}

describe('skilltest parity suite across trees', () => {
  for (const tree of TREES) {
    describe(`Tree: ${tree.name}`, () => {
      test('exports exactly the fixed public API list', async () => {
        const mod = await import(tree.libPath)
        const exports = Object.keys(mod).sort()
        assert.deepEqual(exports, EXPECTED_EXPORTS)
      })

      test('tree binding getTreeName returns expected tree name', async () => {
        const mod = await import(tree.libPath)
        assert.equal(mod.getTreeName(), tree.name)
      })

      test('explicit collectSkillRoots treeName override', async t => {
        const tempGit = await createTempGitRepo(t)
        const agentSkills = path.join(tempGit, '.agents', 'skills')
        const claudeSkills = path.join(tempGit, '.claude', 'skills')
        await fs.mkdir(agentSkills, { recursive: true })
        await fs.mkdir(claudeSkills, { recursive: true })

        const mod = await import(tree.libPath)
        const rootsAgent = await mod.collectSkillRoots(
          tempGit,
          tempGit,
          '.agents'
        )
        const rootsClaude = await mod.collectSkillRoots(
          tempGit,
          tempGit,
          '.claude'
        )

        assert.deepEqual(rootsAgent, [agentSkills])
        assert.deepEqual(rootsClaude, [claudeSkills])
      })

      test('repo root cache and resetRepoRootCache', async t => {
        const outerRepo = await createTempGitRepo(t)
        const innerDir = path.join(outerRepo, 'inner')
        await fs.mkdir(innerDir, { recursive: true })

        const script = `
          import { writeFile } from 'node:fs/promises';
          import { writeReport, resetRepoRootCache } from ${JSON.stringify(tree.libPath)};
          await writeReport({ step: 1 });
          await writeFile('.git', 'gitdir: elsewhere\\n');
          await writeReport({ step: 2 });
          resetRepoRootCache();
          await writeReport({ step: 3 });
        `
        const res = await runSubprocess(
          'node',
          ['--input-type=module', '-e', script],
          {
            cwd: innerDir
          }
        )
        assert.equal(res.code, 0, res.stderr)
        // Before the reset the cached outer root is reused despite the new marker
        assert.deepEqual(await readReportAt(outerRepo), { step: 2 })
        // After the reset the new marker in the unchanged cwd is picked up
        assert.deepEqual(await readReportAt(innerDir), { step: 3 })
      })

      test('side-effect-free legacy import of validate-skills.mjs', async () => {
        const res = await runSubprocess('node', [
          '--input-type=module',
          '-e',
          `import { validateSkills, formatReport } from ${JSON.stringify(tree.validatorPath)};
           console.log('IMPORTED_CLEANLY', typeof validateSkills, typeof formatReport);`
        ])
        assert.equal(res.code, 0, res.stderr)
        assert.ok(res.stdout.includes('IMPORTED_CLEANLY function function'))
        assert.equal(res.stderr, '')
      })

      test('Git root traversal, ordering, tree isolation, nested skills, and duplicates', async t => {
        const tempGit = await createTempGitRepo(t)
        const subDir = path.join(tempGit, 'nested', 'sub')
        await fs.mkdir(subDir, { recursive: true })

        const makeSkill = async (base, skillName, nameInMeta = skillName) => {
          const dir = path.join(base, tree.name, 'skills', skillName)
          await fs.mkdir(dir, { recursive: true })
          const content = `---
name: ${nameInMeta}
description: Testing skill for ${skillName} with enough characters to pass description check.
---
# ${skillName}
`
          await fs.writeFile(path.join(dir, 'SKILL.md'), content)
          return dir
        }

        const otherTreeName = tree.name === '.agents' ? '.claude' : '.agents'
        const otherSkillDir = path.join(
          tempGit,
          otherTreeName,
          'skills',
          'other-tree-skill'
        )
        await fs.mkdir(otherSkillDir, { recursive: true })
        await fs.writeFile(
          path.join(otherSkillDir, 'SKILL.md'),
          `---\nname: other-tree-skill\ndescription: Other tree skill with enough length to be valid.\n---\n`
        )

        await makeSkill(tempGit, 'root-skill')
        await makeSkill(subDir, 'sub-skill')

        await makeSkill(tempGit, 'dup-skill')
        const nestedDupDir = path.join(
          subDir,
          tree.name,
          'skills',
          'nested-dup'
        )
        await fs.mkdir(nestedDupDir, { recursive: true })
        await fs.writeFile(
          path.join(nestedDupDir, 'SKILL.md'),
          `---\nname: dup-skill\ndescription: Duplicate skill with enough characters to pass.\n---\n`
        )

        const script = `
          import { discoverSkills, collectSkillRoots, findRepoRoot } from ${JSON.stringify(tree.libPath)};
          const repo = await findRepoRoot(process.cwd());
          const roots = await collectSkillRoots(process.cwd(), repo);
          const records = await discoverSkills({ includeUserSkills: false });
          console.log(JSON.stringify({ roots, records }));
        `
        const res = await runSubprocess(
          'node',
          ['--input-type=module', '-e', script],
          {
            cwd: subDir
          }
        )
        assert.equal(res.code, 0, res.stderr)
        const out = JSON.parse(res.stdout.trim())

        assert.equal(out.roots.length, 2)
        assert.equal(out.roots[0], path.join(subDir, tree.name, 'skills'))
        assert.equal(out.roots[1], path.join(tempGit, tree.name, 'skills'))

        assert.ok(!out.records.some(r => r.name === 'other-tree-skill'))
        assert.ok(out.records.some(r => r.name === 'root-skill'))
        assert.ok(out.records.some(r => r.name === 'sub-skill'))

        const dupRecords = out.records.filter(r => r.name === 'dup-skill')
        assert.equal(dupRecords.length, 2)
        for (const dup of dupRecords) {
          assert.ok(
            dup.findings.some(
              f =>
                f.level === 'error' &&
                f.message === 'Duplicate skill name detected.'
            )
          )
        }
      })

      test('symlink cases: valid symlink and broken symlink', async t => {
        const tempGit = await createTempGitRepo(t)
        const skillsDir = path.join(tempGit, tree.name, 'skills')
        await fs.mkdir(skillsDir, { recursive: true })

        const targetDir = path.join(tempGit, 'external-skill')
        await fs.mkdir(targetDir, { recursive: true })
        await fs.writeFile(
          path.join(targetDir, 'SKILL.md'),
          `---\nname: linked-skill\ndescription: A valid linked skill with enough characters to pass description check.\n---\n`
        )

        const validLink = path.join(skillsDir, 'linked-skill')
        await fs.symlink(targetDir, validLink)

        const brokenLink = path.join(skillsDir, 'broken-skill')
        await fs.symlink(path.join(tempGit, 'non-existent'), brokenLink)

        const script = `
          import { discoverSkills, loadSkillRecord } from ${JSON.stringify(tree.libPath)};
          const records = await discoverSkills({ includeUserSkills: false });
          const brokenRecord = await loadSkillRecord(${JSON.stringify(brokenLink)});
          console.log(JSON.stringify({ records, brokenRecord }));
        `
        const res = await runSubprocess(
          'node',
          ['--input-type=module', '-e', script],
          {
            cwd: tempGit
          }
        )
        assert.equal(res.code, 0, res.stderr)
        const out = JSON.parse(res.stdout.trim())

        const linkedRecord = out.records.find(r => r.name === 'linked-skill')
        assert.ok(linkedRecord)
        assert.equal(linkedRecord.isSymlink, true)
        assert.equal(linkedRecord.realPath, targetDir)

        assert.ok(out.brokenRecord)
        assert.equal(out.brokenRecord.isSymlink, true)
        assert.ok(
          out.brokenRecord.findings.some(
            f => f.level === 'error' && f.message === 'Broken symlink target.'
          )
        )
      })

      test('user-root resolution for CODEX_HOME and HOME/USERPROFILE', async t => {
        const tempGit = await createTempGitRepo(t)
        const tempHome = await fs.mkdtemp(
          path.join(os.tmpdir(), 'skilltest-home-')
        )
        const customCodexHome = await fs.mkdtemp(
          path.join(os.tmpdir(), 'custom-codex-')
        )
        t.after(async () => {
          await fs.rm(tempHome, { recursive: true, force: true })
          await fs.rm(customCodexHome, { recursive: true, force: true })
        })

        let expectedUserSkillDir
        if (tree.name === '.agents') {
          expectedUserSkillDir = path.join(
            customCodexHome,
            'skills',
            'user-skill'
          )
        } else {
          expectedUserSkillDir = path.join(
            tempHome,
            '.claude',
            'skills',
            'user-skill'
          )
        }
        await fs.mkdir(expectedUserSkillDir, { recursive: true })
        await fs.writeFile(
          path.join(expectedUserSkillDir, 'SKILL.md'),
          `---\nname: user-skill\ndescription: User skill with sufficient character length to pass verification.\n---\n`
        )

        const script = `
          import { discoverSkills } from ${JSON.stringify(tree.libPath)};
          const records = await discoverSkills({ includeUserSkills: true });
          console.log(JSON.stringify(records));
        `
        const res = await runSubprocess(
          'node',
          ['--input-type=module', '-e', script],
          {
            cwd: tempGit,
            HOME: tempHome,
            USERPROFILE: tempHome,
            CODEX_HOME: customCodexHome
          }
        )
        assert.equal(res.code, 0, res.stderr)
        const records = JSON.parse(res.stdout.trim())
        const userRec = records.find(r => r.name === 'user-skill')
        assert.ok(userRec, `user-skill should be found for tree ${tree.name}`)
      })

      test('disabled-config resolution and disabled-path boundaries', async t => {
        const tempGit = await createTempGitRepo(t)
        const tempHome = await fs.mkdtemp(
          path.join(os.tmpdir(), 'skilltest-home-')
        )
        t.after(async () => {
          await fs.rm(tempHome, { recursive: true, force: true })
        })

        const configDir = path.join(tempHome, '.codex')
        await fs.mkdir(configDir, { recursive: true })

        const disabledSkillPath = path.join(tempGit, tree.name, 'skills', 'foo')
        const siblingSkillPath = path.join(
          tempGit,
          tree.name,
          'skills',
          'foobar'
        )
        const nestedDisabledSkillPath = path.join(
          disabledSkillPath,
          'nested-child'
        )

        await fs.writeFile(
          path.join(configDir, 'config.toml'),
          `[[skills.config]]
path = ${JSON.stringify(disabledSkillPath)}
enabled = false

[[skills.config]]
path = ${JSON.stringify(siblingSkillPath)}
enabled = true
`
        )

        const script = `
          import { readDisabledSkills, buildReport } from ${JSON.stringify(tree.libPath)};
          const disabled = await readDisabledSkills();
          const records = [
            {
              name: 'foo',
              skillDir: ${JSON.stringify(disabledSkillPath)},
              skillFile: ${JSON.stringify(path.join(disabledSkillPath, 'SKILL.md'))},
              findings: []
            },
            {
              name: 'foobar',
              skillDir: ${JSON.stringify(siblingSkillPath)},
              skillFile: ${JSON.stringify(path.join(siblingSkillPath, 'SKILL.md'))},
              findings: []
            },
            {
              name: 'nested-child',
              skillDir: ${JSON.stringify(nestedDisabledSkillPath)},
              skillFile: ${JSON.stringify(path.join(nestedDisabledSkillPath, 'SKILL.md'))},
              findings: []
            }
          ];
          const report = buildReport(records, [], disabled);
          console.log(JSON.stringify({ disabled: Array.from(disabled), report }));
        `
        const res = await runSubprocess(
          'node',
          ['--input-type=module', '-e', script],
          {
            cwd: tempGit,
            HOME: tempHome,
            USERPROFILE: tempHome
          }
        )
        assert.equal(res.code, 0, res.stderr)
        const out = JSON.parse(res.stdout.trim())

        assert.ok(out.disabled.includes(disabledSkillPath))
        assert.ok(!out.disabled.includes(siblingSkillPath))

        const foo = out.report.skills.find(s => s.name === 'foo')
        const foobar = out.report.skills.find(s => s.name === 'foobar')
        const nestedChild = out.report.skills.find(
          s => s.name === 'nested-child'
        )

        assert.equal(foo.status, 'disabled')
        assert.equal(foobar.status, 'pass')
        assert.equal(nestedChild.status, 'disabled')
      })

      test('finding statuses, report schema, and output file path', async t => {
        const tempGit = await createTempGitRepo(t)
        const script = `
          import { buildReport, writeReport } from ${JSON.stringify(tree.libPath)};
          const records = [
            {
              name: 'pass-skill',
              skillDir: '/tmp/pass-skill',
              skillFile: '/tmp/pass-skill/SKILL.md',
              findings: []
            },
            {
              name: 'warn-skill',
              skillDir: '/tmp/warn-skill',
              skillFile: '/tmp/warn-skill/SKILL.md',
              findings: [{ level: 'warning', message: 'Warning notice' }]
            },
            {
              name: 'fail-skill',
              skillDir: '/tmp/fail-skill',
              skillFile: '/tmp/fail-skill/SKILL.md',
              findings: [{ level: 'error', message: 'Error failure' }]
            }
          ];
          const report = buildReport(records, [], new Set());
          await writeReport(report);
          console.log(JSON.stringify(report));
        `
        const res = await runSubprocess(
          'node',
          ['--input-type=module', '-e', script],
          {
            cwd: tempGit
          }
        )
        assert.equal(res.code, 0, res.stderr)
        const report = JSON.parse(res.stdout.trim())

        assert.equal(report.summary.total, 3)
        assert.equal(report.summary.pass, 1)
        assert.equal(report.summary.warn, 1)
        assert.equal(report.summary.fail, 1)
        assert.equal(report.summary.disabled, 0)
        assert.deepEqual(report.promptFailures, [])
        assert.equal(report.skills.length, 3)

        const reportFilePath = path.join(
          tempGit,
          'reports',
          'skills',
          'skilltest-report.json'
        )
        assert.ok(
          existsSync(reportFilePath),
          `Report must exist at ${reportFilePath}`
        )
        const writtenContents = JSON.parse(
          await fs.readFile(reportFilePath, 'utf8')
        )
        assert.deepEqual(writtenContents, report)
      })

      test(
        'gate failure order: lint -> test -> build with fake pnpm',
        {
          skip: process.platform === 'win32' && 'fake pnpm is a bash script'
        },
        async t => {
          const tempGit = await createTempGitRepo(t)
          const binDir = path.join(tempGit, 'bin')
          await fs.mkdir(binDir, { recursive: true })

          const logFile = path.join(tempGit, 'commands.log')
          const fakePnpm = path.join(binDir, 'pnpm')
          writeFileSync(
            fakePnpm,
            `#!/usr/bin/env bash
echo "$@" >> "${logFile}"
if [ "$2" == "lint" ]; then
  exit 1
fi
exit 0
`
          )
          chmodSync(fakePnpm, 0o755)

          const script = `
          import { runQualityGate } from ${JSON.stringify(tree.libPath)};
          try {
            await runQualityGate();
            console.log('GATE_PASSED');
          } catch (err) {
            console.log('GATE_FAILED', err.message);
          }
        `
          const res = await runSubprocess(
            'node',
            ['--input-type=module', '-e', script],
            {
              cwd: tempGit,
              env: { PATH: `${binDir}${path.delimiter}${process.env.PATH}` }
            }
          )
          assert.equal(res.code, 0, res.stderr)
          assert.ok(res.stdout.includes('GATE_FAILED'))
          assert.ok(res.stdout.includes('pnpm run lint failed'))

          const executedCmds = (await fs.readFile(logFile, 'utf8'))
            .trim()
            .split('\n')
          assert.deepEqual(executedCmds, ['run lint'])
        }
      )

      test('CLI exit codes and deprecation warning for legacy validate-skills.mjs', async t => {
        const tempGit = await createTempGitRepo(t)
        const skillsDir = path.join(tempGit, tree.name, 'skills', 'good-skill')
        await fs.mkdir(skillsDir, { recursive: true })
        await fs.writeFile(
          path.join(skillsDir, 'SKILL.md'),
          `---\nname: good-skill\ndescription: A valid skill for testing cli output behavior and exit codes.\n---\n`
        )

        const res = await runSubprocess('node', [tree.validatorPath], {
          cwd: tempGit
        })
        assert.equal(res.code, 0)
        assert.ok(res.stderr.includes(tree.deprecationText))
        assert.ok(res.stdout.includes('✅ good-skill'))

        const badSkillsDir = path.join(
          tempGit,
          tree.name,
          'skills',
          'bad-skill'
        )
        await fs.mkdir(badSkillsDir, { recursive: true })
        await fs.writeFile(
          path.join(badSkillsDir, 'SKILL.md'),
          'INVALID FRONTMATTER'
        )

        const resFail = await runSubprocess('node', [tree.validatorPath], {
          cwd: tempGit
        })
        assert.equal(resFail.code, 1)
        assert.ok(resFail.stdout.includes('❌'))
      })

      test('CLI exit codes for validate-skills-cli.mjs', async t => {
        const tempGit = await createTempGitRepo(t)
        const skillsDir = path.join(tempGit, tree.name, 'skills', 'good-skill')
        await fs.mkdir(skillsDir, { recursive: true })
        await fs.writeFile(
          path.join(skillsDir, 'SKILL.md'),
          `---\nname: good-skill\ndescription: A valid skill for testing cli output behavior and exit codes.\n---\n`
        )

        const res = await runSubprocess('node', [tree.cliValidatorPath], {
          cwd: tempGit
        })
        assert.equal(res.code, 0, res.stderr)
        assert.ok(res.stdout.includes('✅ good-skill'))
      })

      test('tree-specific runner execution with --skip-gate on the real skill tree', async t => {
        // Run against a copy of the tree so the report never lands in the working tree
        const tempGit = await createTempGitRepo(t)
        await fs.cp(
          path.join(repoRoot, tree.name, 'skills'),
          path.join(tempGit, tree.name, 'skills'),
          { recursive: true, verbatimSymlinks: true }
        )
        const res = await runSubprocess(
          'node',
          [tree.runnerPath, '--skip-gate'],
          {
            cwd: tempGit,
            HOME: tempGit
          }
        )
        assert.equal(res.code, tree.expectedSkipGateCode, res.stderr)
        assert.ok(res.stdout.includes('skilltest'))

        const report = await readReportAt(tempGit)
        assert.deepEqual(report.promptFailures, tree.expectedPromptFailures)
        const failingSkillDirs = report.skills
          .filter(skill => skill.status === 'fail')
          .map(skill => path.basename(skill.skillDir))
        assert.deepEqual(failingSkillDirs, tree.expectedFailingSkillDirs)
      })
    })
  }

  describe('canonical harness core factory and isolation assertions', () => {
    test('independent instances and isolated caches', async t => {
      const { createHarness } =
        await import('../../scripts/skilltest/harness.mjs')
      const tempGit1 = await createTempGitRepo(t)

      const harness1 = createHarness({
        treeName: '.agents',
        casesDir: path.join(repoRoot, '.agents/skills/skilltest/tests/cases'),
        resolveUserRoots: () => []
      })

      const harness2 = createHarness({
        treeName: '.claude',
        casesDir: path.join(repoRoot, '.claude/skills/skilltest/tests/cases'),
        resolveUserRoots: () => []
      })

      assert.equal(harness1.getTreeName(), '.agents')
      assert.equal(harness2.getTreeName(), '.claude')

      // Caches are isolated per-instance: observed through writeReport with a fixed cwd
      const innerDir = path.join(tempGit1, 'inner')
      await fs.mkdir(innerDir, { recursive: true })
      const harnessModulePath = path.join(
        repoRoot,
        'scripts/skilltest/harness.mjs'
      )
      const script = `
        import { readFile, writeFile } from 'node:fs/promises';
        import { createHarness } from ${JSON.stringify(harnessModulePath)};
        const h1 = createHarness({
          treeName: '.agents',
          casesDir: '/tmp',
          resolveUserRoots: () => []
        });
        const h2 = createHarness({
          treeName: '.claude',
          casesDir: '/tmp',
          resolveUserRoots: () => []
        });
        await h1.writeReport({ writer: 'h1-first' });
        await writeFile('.git', 'gitdir: elsewhere\\n');
        await h2.writeReport({ writer: 'h2' });
        const innerAfterH2 = await readFile('reports/skills/skilltest-report.json', 'utf8');
        await h1.writeReport({ writer: 'h1-cached' });
        h1.resetRepoRootCache();
        await h1.writeReport({ writer: 'h1-refreshed' });
        console.log(JSON.stringify({ innerAfterH2: JSON.parse(innerAfterH2) }));
      `
      const res = await runSubprocess(
        'node',
        ['--input-type=module', '-e', script],
        {
          cwd: innerDir
        }
      )
      assert.equal(res.code, 0, res.stderr)
      const out = JSON.parse(res.stdout.trim())
      // h2 had no cached root, so it resolved the new inner marker
      assert.deepEqual(out.innerAfterH2, { writer: 'h2' })
      // h1 kept its own cached outer root after h2 resolved
      assert.deepEqual(await readReportAt(tempGit1), { writer: 'h1-cached' })
      // Resetting h1 picks up the inner marker
      assert.deepEqual(await readReportAt(innerDir), { writer: 'h1-refreshed' })
    })

    test('malformed frontmatter becomes a finding instead of throwing', async t => {
      const { parseFrontmatter, loadSkillRecord } =
        await import('../../scripts/skilltest/harness.mjs')
      const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'skilltest-frontmatter-')
      )
      t.after(async () => {
        await fs.rm(tempDir, { recursive: true, force: true })
      })

      const malformedYaml =
        '---\nname: bad-yaml\ndescription: Use when testing: broken: yaml\n---\n'
      const arrayName =
        '---\nname: [array-name]\ndescription: Use when testing a non-string name value.\n---\n'
      assert.equal(parseFrontmatter(malformedYaml), null)
      assert.equal(parseFrontmatter(arrayName), null)
      assert.equal(
        parseFrontmatter(
          '---\nname: 123\ndescription: Use when testing.\n---\n'
        ),
        null
      )
      assert.equal(parseFrontmatter('---\n- a list\n---\n'), null)

      for (const [dirName, contents] of [
        ['bad-yaml', malformedYaml],
        ['array-name', arrayName]
      ]) {
        const skillDir = path.join(tempDir, dirName)
        await fs.mkdir(skillDir)
        await fs.writeFile(path.join(skillDir, 'SKILL.md'), contents)
        const record = await loadSkillRecord(skillDir)
        assert.equal(record.name, '')
        assert.deepEqual(record.findings, [
          {
            level: 'error',
            message: 'Missing or invalid frontmatter (name/description).'
          }
        ])
      }
    })

    test('path.win32 disabled-path cases using pure isPathDisabled helper', async () => {
      const { isPathDisabled } =
        await import('../../scripts/skilltest/harness.mjs')

      const disabledSet = new Set([
        'C:\\repo\\skills\\disabled-skill',
        'C:\\repo\\skills\\tooling'
      ])

      // Exact match
      assert.equal(
        isPathDisabled(
          'C:\\repo\\skills\\disabled-skill',
          disabledSet,
          path.win32
        ),
        true
      )

      // Nested child path match
      assert.equal(
        isPathDisabled(
          'C:\\repo\\skills\\disabled-skill\\SKILL.md',
          disabledSet,
          path.win32
        ),
        true
      )

      assert.equal(
        isPathDisabled(
          'C:\\repo\\skills\\tooling\\nested\\sub\\SKILL.md',
          disabledSet,
          path.win32
        ),
        true
      )

      // Sibling prefix substring should NOT match
      assert.equal(
        isPathDisabled(
          'C:\\repo\\skills\\tooling-extra\\SKILL.md',
          disabledSet,
          path.win32
        ),
        false
      )

      assert.equal(
        isPathDisabled(
          'C:\\repo\\skills\\disabled-skill-other',
          disabledSet,
          path.win32
        ),
        false
      )
    })

    test(
      'Windows cmd.exe quality gate invocation platform branching',
      {
        skip: process.platform === 'win32' && 'fake cmd.exe is a bash script'
      },
      async t => {
        const tempGit = await createTempGitRepo(t)
        const binDir = path.join(tempGit, 'bin')
        await fs.mkdir(binDir, { recursive: true })

        const logFile = path.join(tempGit, 'cmd_calls.log')
        const fakeCmd = path.join(binDir, 'cmd.exe')
        writeFileSync(
          fakeCmd,
          `#!/usr/bin/env bash
echo "$@" >> "${logFile}"
exit 0
`
        )
        chmodSync(fakeCmd, 0o755)

        // Test process.platform === 'win32' simulation by running script that overrides process.platform
        const harnessModulePath = path.join(
          repoRoot,
          'scripts/skilltest/harness.mjs'
        )
        const script = `
        Object.defineProperty(process, 'platform', { value: 'win32' });
        const { runQualityGate } = await import(${JSON.stringify(harnessModulePath)});
        await runQualityGate();
      `
        const res = await runSubprocess(
          'node',
          ['--input-type=module', '-e', script],
          {
            cwd: tempGit,
            env: { PATH: `${binDir}${path.delimiter}${process.env.PATH}` }
          }
        )
        assert.equal(res.code, 0, res.stderr)

        const calls = (await fs.readFile(logFile, 'utf8')).trim().split('\n')
        assert.equal(calls.length, 3)
        assert.deepEqual(calls, [
          '/d /s /c pnpm run lint',
          '/d /s /c pnpm run test',
          '/d /s /c pnpm run build'
        ])
      }
    )

    test('invalid configuration errors thrown by createHarness', async () => {
      const { createHarness } =
        await import('../../scripts/skilltest/harness.mjs')

      assert.throws(() => createHarness(null), {
        name: 'TypeError',
        message: 'Harness config must be an object.'
      })

      assert.throws(() => createHarness({}), {
        name: 'TypeError',
        message: 'Harness config.treeName must be a non-empty string.'
      })

      assert.throws(() => createHarness({ treeName: '.agents' }), {
        name: 'TypeError',
        message: 'Harness config.casesDir must be a non-empty string.'
      })

      assert.throws(
        () => createHarness({ treeName: '.agents', casesDir: '/tmp' }),
        {
          name: 'TypeError',
          message: 'Harness config.resolveUserRoots must be a function.'
        }
      )
    })
  })
})

describe('skilltest harness parsing helpers', () => {
  test('parseFrontmatter requires the block at the very top of the file', async () => {
    const { parseFrontmatter } =
      await import('../../scripts/skilltest/harness.mjs')
    const block = '---\nname: example\ndescription: Use when testing.\n---\n'
    assert.deepEqual(parseFrontmatter(block), {
      name: 'example',
      description: 'Use when testing.'
    })
    assert.equal(parseFrontmatter(`intro line\n${block}`), null)
  })

  test('parseYaml reads nested mappings', async () => {
    const { parseYaml } = await import('../../scripts/skilltest/harness.mjs')
    assert.deepEqual(parseYaml('a:\n  b:\n    c: 1\n  d: two\n'), {
      a: { b: { c: 1 }, d: 'two' }
    })
  })
})
