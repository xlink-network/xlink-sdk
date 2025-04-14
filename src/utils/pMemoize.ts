import { GeneralCacheInterface } from "./types/GeneralCacheInterface"

type SkipCacheFn<F extends (...args: readonly any[]) => Promise<any>> = (
  args: Parameters<F>,
  value: Awaited<ReturnType<F>>,
) => Promise<boolean>

export function pMemoize<F extends (...args: readonly any[]) => Promise<any>>(
  options: {
    cacheKey: (args: Parameters<F>) => string
    skipCache?: boolean | SkipCacheFn<F>
  },
  fn: F,
): F {
  type CachedValue = Promise<Awaited<ReturnType<F>>> | Awaited<ReturnType<F>>
  const cache = new Map<string, CachedValue>()

  const skipCache: SkipCacheFn<F> =
    options.skipCache == null
      ? async () => false
      : typeof options.skipCache === "function"
        ? options.skipCache
        : async () => options.skipCache as boolean

  return async function (...args: Parameters<F>) {
    const key = options.cacheKey(args)
    return pMemoizeImpl(cache, key, () => fn(...args), {
      skipCache: value => skipCache(args, value),
    })
  } as any
}

export function pMemoizeImpl<K, V>(
  cache: GeneralCacheInterface<K, Promise<V>>,
  cacheKey: K,
  promiseFactory: () => Promise<V>,
  options?: {
    skipCache?: (result: Awaited<V>) => Promise<boolean>
  },
): Promise<V> {
  const skipCache = options?.skipCache ?? (() => false)

  if (cache.has(cacheKey)) return cache.get(cacheKey)!

  const promise = (async () => {
    const cleanCache = (): void => {
      queueMicrotask(() => {
        if (cache.get(cacheKey) === promise) {
          cache.delete(cacheKey)
        }
      })
    }

    try {
      const result = await promiseFactory()
      if (await skipCache(result)) {
        cleanCache()
      }
      return result
    } catch (e) {
      cleanCache()
      throw e
    }
  })()
  cache.set(cacheKey, promise)
  return promise
}
