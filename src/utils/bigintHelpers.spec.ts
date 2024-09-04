import { describe, it, expect } from "vitest"
import { max, sum } from "./bigintHelpers"

describe("bigintHelpers", () => {
  describe("sum", () => {
    it("should return the sum of an array of bigints", () => {
      expect(sum([1n, 2n, 3n])).toBe(6n)
    })
  })

  describe("max", () => {
    it("should return the max of an array of bigints", () => {
      expect(max([1n, 2n, 3n])).toBe(3n)
    })
  })
})
