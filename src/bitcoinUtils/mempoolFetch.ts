import { XLINKSDKErrorBase } from "../utils/errors"
import { isPlainObject } from "../utils/isPlainObject"

let previousPromise: undefined | Promise<Response>
export const mempoolFetch = async <T>(options: {
  network: "mainnet" | "testnet"
  method?: "get" | "post"
  path: string
  headers?: Record<string, string | number>
  query?: Record<string, string | number>
  body?: any
  parseResponse?: (resp: Response) => Promise<T>
  avoidCache?: boolean
}): Promise<T> => {
  const {
    method: opMethod = "get",
    query: opQuery = {},
    body: opBody,
    parseResponse: opParseResponse = resp => resp.json(),
  } = options

  const queryPairs = Object.entries({
    ...(options.avoidCache ? { ___: Date.now() } : {}),
    ...opQuery,
  })
  const querystring = new URLSearchParams(queryPairs as string[][]).toString()

  const headers = new Headers(options.headers as Record<string, string>)
  if (
    opMethod === "post" &&
    isPlainObject(opBody) &&
    !headers.has("content-type")
  ) {
    headers.set("content-type", "application/json")
  }

  const requestUrl =
    "https://" +
    getMempoolAPIPrefix(options.network) +
    options.path.replace(/^\//, "") +
    "?" +
    querystring

  previousPromise = (previousPromise ?? Promise.resolve()).then(() =>
    fetch(requestUrl, {
      method: opMethod,
      headers: headers,
      body:
        headers.get("content-type")?.toLowerCase() === "application/json"
          ? JSON.stringify(opBody)
          : opBody,
    }),
  )

  const resp = await previousPromise

  if (resp.status < 200 || resp.status >= 300) {
    return resp.text().then(respText => {
      throw new MempoolRequestError(respText, resp)
    })
  }

  return opParseResponse(resp)
}

const getMempoolAPIPrefix = (network: "mainnet" | "testnet"): string => {
  return `mempool.space${network === "mainnet" ? "" : `/${network}`}/api/`
}

export class MempoolRequestError extends XLINKSDKErrorBase {
  cause: {
    data: any
    resp: Response
  }
  constructor(data: any, resp: Response) {
    super("Request mempool.space failed: " + JSON.stringify(data))

    this.cause = {
      data,
      resp,
    }
  }
}
