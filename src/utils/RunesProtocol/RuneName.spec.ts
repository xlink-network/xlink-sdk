import { describe, it, expect } from "vitest"
import { RuneName } from "./RuneName"

describe("RuneName", () => {
  it("works", () => {
    let assertionCount = 0
    const testCase = (input: bigint | number, expected: string): void => {
      assertionCount += 2
      expect(RuneName.decode(BigInt(input))).toEqual(expected)
      expect(RuneName.encode(expected)).toEqual(BigInt(input))
    }

    testCase(0, "A")
    testCase(1, "B")
    testCase(2, "C")
    testCase(3, "D")
    testCase(4, "E")
    testCase(5, "F")
    testCase(6, "G")
    testCase(7, "H")
    testCase(8, "I")
    testCase(9, "J")
    testCase(10, "K")
    testCase(11, "L")
    testCase(12, "M")
    testCase(13, "N")
    testCase(14, "O")
    testCase(15, "P")
    testCase(16, "Q")
    testCase(17, "R")
    testCase(18, "S")
    testCase(19, "T")
    testCase(20, "U")
    testCase(21, "V")
    testCase(22, "W")
    testCase(23, "X")
    testCase(24, "Y")
    testCase(25, "Z")
    testCase(26, "AA")
    testCase(27, "AB")
    testCase(51, "AZ")
    testCase(52, "BA")
    testCase(RuneName.MAX_NUMBER - 2n, "BCGDENLQRQWDSLRUGSNLBTMFIJAT")
    testCase(RuneName.MAX_NUMBER - 1n, "BCGDENLQRQWDSLRUGSNLBTMFIJAU")
    testCase(RuneName.MAX_NUMBER, "BCGDENLQRQWDSLRUGSNLBTMFIJAV")

    expect.assertions(assertionCount)
  })
})
