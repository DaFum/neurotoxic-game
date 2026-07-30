export type ApiQueryValue = string | string[] | undefined

export interface ApiRequest {
  method?: string
  body?: unknown
  query?: Record<string, ApiQueryValue>
  headers?: Record<string, string | string[] | undefined>
  socket?: {
    remoteAddress?: string
  }
}

export interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): ApiResponse
  setHeader(name: string, value: string | readonly string[]): unknown
  end(body?: string): unknown
}
