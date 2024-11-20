import { backendAPIPrefix } from "../config"

export async function requestAPI<T>(options: {
  path: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  query?: Record<string, string>
  body?: Record<string, unknown>
}): Promise<T> {
  const queryPairs = Object.entries(options.query ?? {})
  const querystring = new URLSearchParams(queryPairs as string[][]).toString()

  const res = await fetch(
    `${backendAPIPrefix}${options.path}`.replace(/(\w)\/\//g, "$1/") +
      (querystring ? "?" + querystring : ""),
    {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.body),
    },
  )

  return readAPIResponse(res)
}

export const readAPIResponse = async <T>(resp: Response): Promise<T> => {
  if (resp.status >= 200 && resp.status < 300) {
    return resp.json() as any
  }

  if (resp.status === 429) {
    throw new TooManyRequestsError(resp)
  }

  const respText = await resp.text()
  let respData: null | any = null
  try {
    respData = JSON.parse(respText)
  } catch {
    respData = respText
  }

  const thirdPartyError = ThirdPartyRequestError.fromSerializedError(respData)
  if (thirdPartyError != null) {
    throw thirdPartyError
  }

  throw new RequestError(
    {
      url: resp.url,
      status: resp.status,
      body: respText,
    },
    {
      cause: respData,
    },
  )
}

export class TooManyRequestsError extends Error {
  requestUrl: string
  retryAfter?: number

  constructor(resp: Response, options?: ErrorConstructorOptions) {
    const _retryAfter = Number(resp.headers.get("Retry-After"))
    const retryAfter = Number.isNaN(_retryAfter) ? undefined : _retryAfter

    let errMsg = `Too many requests to SDK API server`
    if (retryAfter != null) {
      errMsg += `; retry after ${retryAfter} seconds`
    }

    super(errMsg, {
      ...options,
      cause: options?.cause ?? resp,
    })

    this.requestUrl = resp.url
    this.retryAfter = retryAfter
  }
}

export class ThirdPartyRequestError extends Error {
  isThirdPartyRequestError = true

  static fromSerializedError(err: any): undefined | ThirdPartyRequestError {
    if (!err.isThirdPartyRequestError) return
    return new ThirdPartyRequestError(err.serviceName, {
      cause: err.cause,
    })
  }

  constructor(
    public serviceName: string,
    options?: ErrorConstructorOptions,
  ) {
    super(`Request service ${serviceName} failed`, options)
  }
}

export class RequestError extends Error {
  constructor(
    public response: {
      url: string
      status: number
      body: string
    },
    options?: ErrorConstructorOptions,
  ) {
    super(
      `Request failed:
url: ${response.url}
detail: ${response.body}`,
      options,
    )
  }
}
