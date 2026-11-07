#!/usr/bin/env node
import { runSkilltestCli } from '../../../../scripts/skilltest/cli.mjs'
import * as harness from './skilltest-lib.mjs'

runSkilltestCli(harness, process.argv)
