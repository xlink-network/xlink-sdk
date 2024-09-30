interface ErrorConstructor {
  new (message?: string, options?: ErrorConstructorOptions): Error
  (message?: string): Error
  readonly prototype: Error
}

interface ErrorConstructorOptions {
  cause?: any
}

interface Error {
  name: string
  message: string
  stack?: string
  cause?: any
}
