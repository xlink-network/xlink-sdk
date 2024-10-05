import { describe, expect, it } from "vitest"
import { BigNumber, BigNumberSource } from "./BigNumber"

describe("BigNumber", () => {
  describe("round", () => {
    describe("roundHalfEven", () => {
      it("should round to the nearest even number", () => {
        const t = (
          expected: BigNumberSource,
          value: BigNumberSource,
          precision: number,
        ): void => {
          expect(
            BigNumber.round(
              {
                precision,
                roundingMode: BigNumber.roundHalfEven,
              },
              value,
            ),
            `t("${expected}", "${value}", ${precision})`,
          ).toEqual(BigNumber.from(expected))
        }

        t("123.4", "123.45", 1)
        t("123.4", "123.35", 1)
        t("123.4", "123.41", 1)
        t("123.4", "123.36", 1)
      })
    })
  })

  describe("sum", () => {
    it("should return the sum of an array of BigNumber values", () => {
      const numbers = [1, BigNumber.from(2), "3"]
      expect(BigNumber.sum(numbers)).toEqual(BigNumber.from(6))
    })
  })

  describe("getDecimalPart", () => {
    it("should return the decimal part of a BigNumber value", () => {
      expect(BigNumber.getDecimalPart({ precision: 10 }, "123.45")).toEqual(
        "45",
      )
    })
  })
})
