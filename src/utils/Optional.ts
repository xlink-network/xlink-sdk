export type Optional<T> = Optional.Some<T> | Optional.None

export namespace Optional {
  export interface Some<T> {
    type: "some"
    payload: T
  }

  export interface None {
    type: "none"
  }

  export const isOptional = <T>(input: any): input is Optional<T> => {
    if (input == null) return false
    if (typeof input !== "object") return false
    if (input.type !== "some" && input.type !== "none") return false
    return true
  }

  export const some = <const TOK>(payload: TOK): Optional.Some<TOK> => ({
    type: "some",
    payload,
  })

  export const none = (): Optional.None => ({
    type: "none",
  })

  export const maybeSome = <T>(res: Optional<T>): undefined | T => {
    if (res.type === "some") return res.payload
    return
  }

  export function encaseOptional<TOK>(fn: () => TOK): Optional<TOK> {
    try {
      return some(fn())
    } catch (e: unknown) {
      return none()
    }
  }

  export function encaseMaybeSome<TOK>(fn: () => TOK): undefined | TOK
  export function encaseMaybeSome<TOK, TFallback>(
    fallbackValue: TFallback,
    fn: () => TOK,
  ): TOK | TFallback
  export function encaseMaybeSome<TOK, TFallback>(
    ...args: [fallbackValue: TFallback, fn: () => TOK] | [fn: () => TOK]
  ): undefined | TOK | TFallback {
    const [fallbackValue, fn] = args.length === 1 ? [undefined, args[0]] : args
    const res = encaseOptional(fn)
    return res.type === "some" ? res.payload : fallbackValue
  }

  interface CurriedMapFn {
    <TOKInput, TOKOutput>(
      mapping: (payload: TOKInput) => TOKOutput,
    ): (res: Optional<TOKInput>) => Optional<TOKOutput>
    <TOKInput, TOKOutput>(
      mapping: (payload: TOKInput) => TOKOutput,
      res: Optional<TOKInput>,
    ): Optional<TOKOutput>
  }
  export const map: CurriedMapFn = <TOKInput, TOKOutput>(
    mapping: (payload: TOKInput) => TOKOutput,
    res?: Optional<TOKInput>,
  ): any => {
    if (res == null) {
      return (res: Optional<TOKInput>) => realMap(mapping, res)
    } else {
      return realMap(mapping, res)
    }

    function realMap(
      mapping: (payload: TOKInput) => TOKOutput,
      res: Optional<TOKInput>,
    ): Optional<TOKOutput> {
      if (res.type === "none") return res
      return Optional.some(mapping(res.payload))
    }
  }

  interface CurriedFlatMapFn {
    <TOKInput, TOKOutput>(
      mapping: (payload: TOKInput) => Optional<TOKOutput>,
    ): (res: Optional<TOKInput>) => Optional<TOKOutput>
    <TOKInput, TOKOutput>(
      mapping: (payload: TOKInput) => Optional<TOKOutput>,
      res: Optional<TOKInput>,
    ): Optional<TOKOutput>
  }
  export const flatMap: CurriedFlatMapFn = <TOKInput, TOKOutput>(
    mapping: (payload: TOKInput) => Optional<TOKOutput>,
    res?: Optional<TOKInput>,
  ): any => {
    if (res == null) {
      return (res: Optional<TOKInput>) => realFlatMap(mapping, res)
    } else {
      return realFlatMap(mapping, res)
    }

    function realFlatMap(
      mapping: (payload: TOKInput) => Optional<TOKOutput>,
      res: Optional<TOKInput>,
    ): Optional<TOKOutput> {
      if (res.type === "none") return res
      return mapping(res.payload)
    }
  }
}
