import { describe, expect, it } from "vitest"
import { PATCH } from "./route"
import { store } from "@/data/store"

function request(status: string) {
  return new Request("http://localhost/api/cards", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  })
}

describe("PATCH /api/cards/:id", () => {
  it("rejects an illegal transition from cancelled", async () => {
    const card = {
      id: `route-status-${crypto.randomUUID()}`,
      nickname: "Cancelled test card",
      merchantId: "mch_01",
      merchantCategory: "software",
      limitMinorUnits: 25_000,
      currency: "USD" as const,
      status: "cancelled" as const,
      createdAt: new Date().toISOString(),
      spendMinorUnits: 0,
      last4: "4242",
      cardReference: "ref_test",
      statusHistory: [
        { status: "cancelled" as const, changedAt: new Date().toISOString() },
      ],
    }
    store.cards.push(card)
    const response = await PATCH(request("active"), {
      params: Promise.resolve({ id: card.id }),
    })
    expect(response.status).toBe(409)
    expect(card.statusHistory).toHaveLength(1)
  })
})
