export const MAX_BIGINT = BigInt(Number.MAX_VALUE)

export function sum(nums: bigint[]): bigint {
  return nums.reduce((acc, val) => acc + val, 0n)
}

export function max(nums: bigint[]): bigint {
  return nums.reduce((acc, val) => (acc > val ? acc : val), 0n)
}
