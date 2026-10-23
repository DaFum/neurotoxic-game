import type {
  ZealotryActionConfig,
  DarkWebLeakConfig,
  CultIndoctrinationConfig
} from '../types'
import {
  DARK_WEB_LEAK_REQUIRED_CONTROVERSY,
  CULT_INDOCTRINATION_REQUIRED_ZEALOTRY,
  VOID_SERMON_REQUIRED_ZEALOTRY
} from './zealotryActionGates'

/** Tuning values for the pirate-radio social action. */
export const PIRATE_RADIO_CONFIG: ZealotryActionConfig = Object.freeze({
  COST: 200,
  FAME_GAIN: 150,
  ZEALOTRY_GAIN: 15,
  CONTROVERSY_GAIN: 20,
  HARMONY_COST: 10
})

/** Tuning values for the dark-web leak social action. */
export const DARK_WEB_LEAK_CONFIG: DarkWebLeakConfig = Object.freeze({
  COST: 500,
  FAME_GAIN: 300,
  ZEALOTRY_GAIN: 25,
  CONTROVERSY_GAIN: 30,
  HARMONY_COST: 20,
  REQUIRED_CONTROVERSY: DARK_WEB_LEAK_REQUIRED_CONTROVERSY
})

/** Tuning values for the cult indoctrination social action. */
export const CULT_INDOCTRINATION_CONFIG: CultIndoctrinationConfig = Object.freeze({
  COST: 1000,
  FAME_GAIN: 500,
  ZEALOTRY_GAIN: 40,
  CONTROVERSY_GAIN: 50,
  HARMONY_COST: 30,
  REQUIRED_ZEALOTRY: CULT_INDOCTRINATION_REQUIRED_ZEALOTRY
})

/** Tuning values for the void sermon social action. */
export const VOID_SERMON_CONFIG: ZealotryActionConfig = Object.freeze({
  COST: 750,
  FAME_GAIN: 400,
  ZEALOTRY_GAIN: 25,
  CONTROVERSY_GAIN: 40,
  HARMONY_COST: 25,
  REQUIRED_ZEALOTRY: VOID_SERMON_REQUIRED_ZEALOTRY
})
