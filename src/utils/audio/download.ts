import { AUDIO_BUFFER_LOAD_TIMEOUT_MS } from './constants'

/** Keeps the download timeout active through response body consumption. */
export async function fetchWithTimeout<T>(
  url: string,
  readResponse: (response: Response) => Promise<T>
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    AUDIO_BUFFER_LOAD_TIMEOUT_MS
  )
  try {
    const response = await fetch(url, { signal: controller.signal })
    return await readResponse(response)
  } finally {
    clearTimeout(timeoutId)
  }
}
