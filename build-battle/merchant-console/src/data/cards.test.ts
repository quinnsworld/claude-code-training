import { describe, expect, it } from "vitest"
import {
  canTransitionStatus,
  generateTestCardNumber,
  isValidLuhn,
} from "./cards"

describe("virtual card rules", () => {
  it("generates a valid 4242 test number", () => {
    const number = generateTestCardNumber(() => 0.4)
    expect(number).toMatch(/^4242\d{12}$/)
    expect(isValidLuhn(number)).toBe(true)
  })

  it("enforces status transitions", () => {
    expect(canTransitionStatus("active", "frozen")).toBe(true)
    expect(canTransitionStatus("frozen", "active")).toBe(true)
    expect(canTransitionStatus("active", "cancelled")).toBe(true)
    expect(canTransitionStatus("cancelled", "active")).toBe(false)
  })
})
