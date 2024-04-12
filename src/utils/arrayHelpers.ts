export function hasAny<T>(ary: T[]): ary is [T, ...T[]]
export function hasAny<T>(ary: readonly T[]): ary is readonly [T, ...T[]]
export function hasAny<T>(ary: readonly T[]): ary is readonly [T, ...T[]] {
  return ary.length > 0
}

export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => i + start)
}

export function uniq<T>(
  ary: T[],
  iteratee: (item: T) => any = item => item,
): T[] {
  const seen = new Set<any>()
  return ary.filter(item => {
    const key = iteratee(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function oneOf<T extends string[]>(
  ...coll: T
): (input: unknown) => input is T[number]
export function oneOf<T extends any[]>(
  ...coll: T
): (input: unknown) => input is T[number]
export function oneOf<T extends any[]>(
  ...coll: T
): (input: unknown) => input is T[number] {
  return ((input: unknown) => coll.includes(input)) as any
}

export type SortByIteratee<T> = (
  item: T,
  index: number,
  ary: T[],
) => number | bigint
/**
 * https://github.com/jashkenas/underscore/blob/1abc36c169947c54c97e266513b1d763d0198f46/modules/sortBy.js
 */
export function sortBy<T>(
  iteratee: SortByIteratee<T> | SortByIteratee<T>[],
  ary: T[],
): T[] {
  const _iteratee = Array.isArray(iteratee) ? iteratee : [iteratee]

  return ary
    .map((value, index, ary) => ({
      value: value,
      index: index,
      criteria: _iteratee.map(f => f(value, index, ary)),
    }))
    .sort((left, right) => compareMultiple(left, right))
    .map(v => v.value)
}
interface CompareMultipleItem<T> {
  value: T
  index: number
  criteria: (number | bigint)[]
}
/**
 * https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L4632-L4657
 */
function compareMultiple<T>(
  obj: CompareMultipleItem<T>,
  oth: CompareMultipleItem<T>,
): number {
  const objCriteria = obj.criteria
  const othCriteria = oth.criteria
  const length = objCriteria.length

  let index = -1
  while (++index < length) {
    const objCri = objCriteria[index]
    const othCri = othCriteria[index]

    let result = 0
    if (typeof objCri === typeof othCri) {
      result = Number((objCri as bigint) - (othCri as bigint))
    } else {
      result = Number(objCri) - Number(othCri)
    }
    if (result) return result
  }

  return obj.index - oth.index
}
