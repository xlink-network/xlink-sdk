import { UnboxPromise } from "./promiseHelpers"

const keySeparator = `__$$__${Date.now()}__$$__`

type SkipCacheFn<F extends (...args: readonly string[]) => Promise<any>> = (
  args: string[],
  value: UnboxPromise<ReturnType<F>>,
) => Promise<boolean>

export default function pMemoize<
  F extends (...args: readonly string[]) => Promise<any>,
>(
  fn: F,
  options: {
    skipCache?: boolean | SkipCacheFn<F>
  } = {},
): F {
  type CachedValue = Promise<Awaited<ReturnType<F>>> | Awaited<ReturnType<F>>
  const cache = new Map<string, CachedValue>()

  const skipCache: SkipCacheFn<F> =
    options.skipCache == null
      ? async () => false
      : typeof options.skipCache === "function"
        ? options.skipCache
        : async () => options.skipCache as boolean

  return async function (...args: string[]) {
    const key = args.join(keySeparator)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const promise = (async () => {
      const cleanCache = (): void => {
        queueMicrotask(() => {
          if (cache.get(key) === promise) {
            cache.delete(key)
          }
        })
      }

      try {
        const result = await fn(...args)
        if (await skipCache(args, result)) {
          cleanCache()
        }
        return result
      } catch (e) {
        cleanCache()
        throw e
      }
    })()
    cache.set(key, promise)
    return promise
  } as any
}
