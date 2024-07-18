export function isNotNull<T>(input: T | undefined | null): input is T {
  return input != null
}

export function checkNever(_x: never): undefined {
  /* do nothing */
  return
}

export type StringOnly<T> = Extract<T, string>

export type NumberOnly<T> = Extract<T, number>

export type OneOrMore<T> = readonly [T, ...T[]]

export type CompactType<T> = {
  [P in keyof T]: T[P]
}

/**
 * WARNING: This is a hack do type exhaustiveness check
 */
export function assertExclude<T, const E>(
  asserting: T,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  excluding: E,
): asserts asserting is Exclude<T, E> {
  return
}
export namespace assertExclude {
  export const i = <T>(): T => null as any
}
