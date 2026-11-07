#!/usr/bin/env node
import { runValidateSkillsCli } from '../../../../scripts/skilltest/cli.mjs'
import * as harness from './skilltest-lib.mjs'

runValidateSkillsCli(harness, process.argv)
