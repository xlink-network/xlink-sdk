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
