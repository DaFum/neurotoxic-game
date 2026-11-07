#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import nodePath from 'node:path'
import {
  validateSkills as sharedValidateSkills,
  formatReport as sharedFormatReport,
  runLegacyValidateSkillsCli
} from '../../../../scripts/skilltest/cli.mjs'
import * as harness from './skilltest-lib.mjs'

export const validateSkills = ({ includeUserSkills }) =>
  sharedValidateSkills(harness, { includeUserSkills })

export const formatReport = results => sharedFormatReport(results)

const __filename = fileURLToPath(import.meta.url)
const isMainModule =
  process.argv[1] &&
  nodePath.resolve(__filename) === nodePath.resolve(process.argv[1])

if (isMainModule) {
  runLegacyValidateSkillsCli(
    harness,
    'Deprecated: use ".claude/skills/skilltest/scripts/skilltest.mjs" instead.',
    process.argv
  )
}
