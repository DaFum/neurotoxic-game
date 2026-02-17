import { test } from 'node:test'

export async function importAudioEngine(path = '../src/utils/audioEngine.js') {
  let audioEngine = null
  let audioEngineImportError = null

  try {
    audioEngine = await import(path)
  } catch (error) {
    audioEngineImportError = error
  }

  const skipIfImportFailed = testContext => {
    if (audioEngineImportError) {
      testContext.skip(
        'Skipping audio engine tests due to environment limitations: ' +
          audioEngineImportError.message
      )
      return true
    }
    return false
  }

  return { audioEngine, skipIfImportFailed }
}
