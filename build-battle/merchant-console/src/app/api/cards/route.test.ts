import { describe, expect, it } from "vitest"
import { POST } from "./route"
import { store } from "@/data/store"

function request(body: Record<string, unknown>, idempotencyKey?: string) {
  return new Request("http://localhost/api/cards", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  })
}

const valid = {
  nickname: "Route test card",
  merchantId: "mch_01",
  limitMinorUnits: 25_000,
  currency: "USD",
  merchantCategory: "software",
}

describe("POST /api/cards", () => {
  it("rejects a currency that does not match the merchant", async () => {
    const response = await POST(request({ ...valid, currency: "EUR" }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Currency must match the merchant settlement currency (USD)",
    })
  })

  it("returns the same card for a repeated idempotency key", async () => {
    const key = `route-test-${crypto.randomUUID()}`
    const first = await POST(request(valid, key))
    const second = await POST(request(valid, key))
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    expect(await second.json()).toEqual(await first.json())
    expect(
      store.cards.filter((card) => card.nickname === valid.nickname),
    ).toHaveLength(1)
  })
})
