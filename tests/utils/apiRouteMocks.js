import { vi } from 'vitest'

export function createApiRouteMocks({
  method = 'GET',
  headers,
  query,
  body
} = {}) {
  const req = {
    method,
    ...(headers === undefined ? {} : { headers }),
    ...(query === undefined ? {} : { query }),
    ...(body === undefined ? {} : { body })
  }

  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
    setHeader: vi.fn(),
    end: vi.fn(() => res)
  }

  return { req, res }
}
