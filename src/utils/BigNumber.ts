import * as dn from "dnum"
import { OneOrMore } from "./typeHelpers"

export type BigNumberSource = number | bigint | string | BigNumber | dn.Dnum

const DECIMAL_PLACES = 18 + 2

const toImpl = (num: BigNumberSource): dn.Dnum => {
  if (BigNumber.isBigNumber(num) || dn.isDnum(num)) {
    return num as any
  }

  return dn.from(num)
}

const fromImpl = (num: dn.Dnum): BigNumber => {
  return num as unknown as BigNumber
}

export type BigNumber = object & {
  ___B: "BigNumber"
}
export namespace BigNumber {
  export const roundUp = "ROUND_UP"
  export const roundDown = "ROUND_DOWN"
  export const roundHalf = "ROUND_HALF"
  export const roundHalfEven = "ROUND_HALF_EVEN"
  export type RoundingMode =
    | typeof roundUp
    | typeof roundDown
    | typeof roundHalf
    | typeof roundHalfEven

  const translateToDnumRoundingMode = (
    roundingMode: typeof roundUp | typeof roundDown | typeof roundHalf,
  ): dn.Rounding => {
    switch (roundingMode) {
      case roundUp:
        return "ROUND_UP"
      case roundDown:
        return "ROUND_DOWN"
      case roundHalf:
        return "ROUND_HALF"
    }
  }

  let defaultRoundingMode: RoundingMode = roundHalf
  export const setDefaultRoundingMode = (roundingMode: RoundingMode): void => {
    defaultRoundingMode = roundingMode
  }

  export const isBigNumber = (num: any): num is BigNumber => {
    return dn.isDnum(num)
  }

  export const safeFrom = (value: BigNumberSource): undefined | BigNumber => {
    try {
      return from(value)
    } catch (e) {
      return undefined
    }
  }

  export const from = (value: BigNumberSource): BigNumber => {
    return fromImpl(toImpl(value as any))
  }

  export const isEven = (value: BigNumberSource): boolean => {
    const dnum = toImpl(value)
    return dnum[0] % 2n === 0n
  }

  export const round = curry2(
    (
      options: {
        precision?: number
        roundingMode?: RoundingMode
      },
      value: BigNumberSource,
    ): BigNumber => {
      const precision = options.precision ?? 0
      const roundingMode = options.roundingMode ?? defaultRoundingMode

      if (roundingMode === roundHalfEven) {
        const dnum = toImpl(value)
        const intLength = getIntegerLength(value)
        const finalLength = intLength + precision

        const numStr = String(dnum[0])
        const prevNum = numStr[finalLength - 1]
        const currNum = numStr[finalLength]

        // prettier-ignore
        const roundingMode: dn.Rounding =
          currNum !== "5" ? "ROUND_HALF" :
          Number(prevNum) % 2 === 0 ? "ROUND_DOWN" : "ROUND_UP"

        return fromImpl(
          dn.setDecimals(toImpl(value), precision, {
            rounding: roundingMode,
          }),
        )
      }

      return fromImpl(
        dn.setDecimals(toImpl(value), precision, {
          rounding: translateToDnumRoundingMode(roundingMode),
        }),
      )
    },
  )

  export const toString = (value: BigNumberSource): string => {
    return dn.toString(toImpl(value))
  }

  export const toNumber = (value: BigNumberSource): number => {
    return dn.toNumber(toImpl(value))
  }

  export const toBigInt = curry2(
    (
      options: {
        roundingMode?: RoundingMode
      },
      value: BigNumberSource,
    ): bigint => {
      return BigInt(
        toFixed({ precision: 0, roundingMode: options.roundingMode }, value),
      )
    },
  )

  export const toFixed = curry2(
    (
      options: {
        precision?: number
        roundingMode?: RoundingMode
      },
      value: BigNumberSource,
    ): string => {
      return toString(round(options, value))
    },
  )

  export const isNegative = (value: BigNumberSource): boolean => {
    return isLt(value, 0)
  }

  export const isGtZero = (value: BigNumberSource): boolean => {
    return isGt(value, 0)
  }

  export const isZero = (value: BigNumberSource): boolean => {
    return isEq(value, 0)
  }

  export const isGte = curry2(
    (value: BigNumberSource, a: BigNumberSource): boolean => {
      return isGt(value, a) || isEq(value, a)
    },
  )

  export const isLte = curry2(
    (value: BigNumberSource, a: BigNumberSource): boolean => {
      return isLt(value, a) || isEq(value, a)
    },
  )

  export const isEq = curry2(
    (value: BigNumberSource, a: BigNumberSource): boolean => {
      return dn.eq(toImpl(value), toImpl(a))
    },
  )

  export const isGt = curry2(
    (value: BigNumberSource, a: BigNumberSource): boolean => {
      return dn.gt(toImpl(value), toImpl(a))
    },
  )

  export const isLt = curry2(
    (value: BigNumberSource, a: BigNumberSource): boolean => {
      return dn.lt(toImpl(value), toImpl(a))
    },
  )

  export const getPrecision = (value: BigNumberSource): number => {
    return toImpl(value)[1]
  }

  export const getIntegerLength = (value: BigNumberSource): number => {
    const dnum = toImpl(value)
    return String(dnum[0]).length - dnum[1]
  }

  export const getDecimalPart = curry2(
    (
      options: { precision: number },
      value: BigNumberSource,
    ): undefined | string => {
      const dnum = toImpl(value)
      const decimalLength = getPrecision(value)
      const decimalPart = String(dnum[0]).slice(-decimalLength)
      return decimalPart.slice(0, options.precision)
    },
  )

  export const leftMoveDecimals = curry2(
    (distance: number, value: BigNumberSource): BigNumber =>
      moveDecimals({ distance }, value),
  )

  export const rightMoveDecimals = curry2(
    (distance: number, value: BigNumberSource): BigNumber =>
      moveDecimals({ distance: -distance }, value),
  )

  export const moveDecimals = curry2(
    (options: { distance: number }, value: BigNumberSource): BigNumber => {
      if (options.distance > 0) {
        return div(value, 10 ** options.distance)
      }

      if (options.distance < 0) {
        return mul(value, 10 ** -options.distance)
      }

      // distance === 0
      return from(value)
    },
  )

  export const abs = (value: BigNumberSource): BigNumber => {
    return fromImpl(dn.abs(toImpl(value)))
  }

  export const neg = (value: BigNumberSource): BigNumber => {
    const dnum = toImpl(value)

    const negated: [value: dn.Value, decimals: dn.Decimals] =
      dnum.slice() as any
    negated[0] = -negated[0]

    return fromImpl(negated)
  }

  export const add = curry2(
    (value: BigNumberSource, a: BigNumberSource): BigNumber => {
      return fromImpl(dn.add(toImpl(value), toImpl(a)))
    },
  )

  export const minus = curry2(
    (value: BigNumberSource, a: BigNumberSource): BigNumber => {
      return fromImpl(dn.sub(toImpl(value), toImpl(a)))
    },
  )

  export const mul = curry2(
    (value: BigNumberSource, a: BigNumberSource): BigNumber => {
      return fromImpl(
        dn.mul(toImpl(value), toImpl(a), { decimals: DECIMAL_PLACES }),
      )
    },
  )

  export const div = curry2(
    (value: BigNumberSource, a: BigNumberSource): BigNumber => {
      return fromImpl(
        dn.div(toImpl(value), toImpl(a), { decimals: DECIMAL_PLACES }),
      )
    },
  )

  export const pow = curry2((value: BigNumberSource, a: number): BigNumber => {
    let res = from(value)

    const powTarget = value
    for (let i = 1; i < a; i++) {
      res = mul(res, powTarget)
    }

    return res
  })

  export const ascend = curry2(
    (a: BigNumberSource, b: BigNumberSource): -1 | 0 | 1 =>
      isLt(a, b) ? -1 : isGt(a, b) ? 1 : 0,
  )

  export const descend = curry2(
    (a: BigNumberSource, b: BigNumberSource): -1 | 0 | 1 =>
      isLt(a, b) ? 1 : isGt(a, b) ? -1 : 0,
  )

  export const sort = (
    comparator: (a: BigNumber, b: BigNumber) => -1 | 0 | 1,
    numbers: readonly BigNumberSource[],
  ): BigNumber[] => {
    const _numbers = numbers.map(a => fromImpl(toImpl(a)))
    _numbers.sort(comparator)
    return _numbers
  }

  export const max = (numbers: OneOrMore<BigNumberSource>): BigNumber => {
    return from(sort(descend, numbers)[0]!)
  }

  export const min = (numbers: OneOrMore<BigNumberSource>): BigNumber => {
    return from(sort(ascend, numbers)[0]!)
  }

  export const clamp = (
    range: [min: BigNumber, max: BigNumber],
    n: BigNumber,
  ): BigNumber => {
    const [min, max] = range
    if (isGte(n, max)) return max
    if (isLte(n, min)) return min
    return n
  }

  export const sum = (numbers: BigNumberSource[]): BigNumber => {
    return numbers
      .map(n => fromImpl(toImpl(n)))
      .reduce((acc, n) => add(acc, n), ZERO)
  }

  export const ZERO = BigNumber.from(0)
}

interface Curry2<Args extends [any, any], Ret> {
  (a: Args[0]): (b: Args[1]) => Ret
  (a: Args[0], b: Args[1]): Ret
}
function curry2<Args extends [any, any], Ret>(
  fn: (...args: Args) => Ret,
): Curry2<Args, Ret> {
  return function (a: Args[0], b?: Args[1]): Ret {
    if (arguments.length > 1) {
      return (fn as any)(a, b)
    }
    return ((b: Args[1]): Ret => (fn as any)(a, b)) as any
  } as any
}
