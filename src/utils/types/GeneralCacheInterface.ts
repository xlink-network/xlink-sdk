export interface GeneralCacheInterface<K, T> {
  has: (key: K) => boolean
  get: (key: K) => undefined | T
  set: (key: K, value: T) => void
  delete: (key: K) => void
}
