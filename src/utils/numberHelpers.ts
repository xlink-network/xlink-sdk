export function sum(arr: readonly number[]): number {
  return arr.reduce((acc, item) => acc + item, 0)
}
