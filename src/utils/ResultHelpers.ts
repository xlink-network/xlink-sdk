import { identity } from "./funcHelpers"
import { Result } from "./Result"

export function encase<T, T1>(
  mapping: (res: T) => T1,
  fn: () => T,
): undefined | T1
export function encase<T>(fn: () => T): undefined | T
export function encase<T, T1>(
  ...args: [mapping: (res: T) => T1, fn: () => T] | [fn: () => T]
): undefined | T1 {
  const [mapping, fn] = args.length === 1 ? [undefined, args[0]] : args
  return Result.maybeValue(
    Result.map(mapping ?? (identity as any), Result.encase(fn)),
  )
}
