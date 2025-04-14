export function entries<T>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj as any) as [keyof T, T[keyof T]][]
}
export function fromEntries<T>(entries: [keyof T, T[keyof T]][]): T {
  return Object.fromEntries(entries) as T
}
