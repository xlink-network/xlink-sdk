export type UnboxPromise<T> = T extends PromiseLike<infer R> ? R : T

export async function props<I extends Record<string, any>>(
  inputs: I,
): Promise<{ [K in keyof I]: UnboxPromise<I[K]> }> {
  const res = await Promise.all(Object.values(inputs))
  return Object.fromEntries(
    Object.keys(inputs).map((k, i) => [k, res[i]]) as any,
  ) as any
}
