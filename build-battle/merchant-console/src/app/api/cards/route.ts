import {
  generateTestCardNumber,
  isCardCategory,
  safeCard,
  validateCardInput,
} from "@/data/cards"
import { merchantById } from "@/data/merchants"
import { store } from "@/data/store"
import { Currency } from "@/data/types"
import { NextResponse } from "next/server"

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000
const recentIssues = new Map<string, { createdAt: number; response: unknown }>()

function pruneRecentIssues(now: number) {
  for (const [key, entry] of recentIssues) {
    if (now - entry.createdAt >= IDEMPOTENCY_TTL_MS) recentIssues.delete(key)
  }
}

export async function GET() {
  return NextResponse.json(store.cards.map(safeCard))
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null
  const idempotencyKey = request.headers.get("idempotency-key")?.trim()
  pruneRecentIssues(Date.now())
  if (idempotencyKey) {
    const previous = recentIssues.get(idempotencyKey)
    if (previous && Date.now() - previous.createdAt < IDEMPOTENCY_TTL_MS)
      return NextResponse.json(previous.response, { status: 201 })
    recentIssues.delete(idempotencyKey)
  }
  const input = {
    nickname: body?.nickname,
    merchantId: body?.merchantId,
    limitMinorUnits: body?.limitMinorUnits,
    currency: body?.currency,
    merchantCategory: body?.merchantCategory,
  }
  const error = validateCardInput(input)
  if (error) return NextResponse.json({ message: error }, { status: 400 })
  const merchant = merchantById(input.merchantId as string)
  if (!merchant)
    return NextResponse.json(
      { message: "Merchant was not found" },
      { status: 400 },
    )
  if (merchant.currency !== input.currency)
    return NextResponse.json(
      {
        message: `Currency must match the merchant settlement currency (${merchant.currency})`,
      },
      { status: 400 },
    )
  if (!isCardCategory(input.merchantCategory))
    return NextResponse.json(
      { message: "Merchant category is required" },
      { status: 400 },
    )

  const fullNumber = generateTestCardNumber()
  const now = new Date().toISOString()
  const card = {
    id: `vcard_${crypto.randomUUID().slice(0, 8)}`,
    nickname: (input.nickname as string).trim(),
    merchantId: input.merchantId as string,
    merchantCategory: input.merchantCategory,
    limitMinorUnits: input.limitMinorUnits as number,
    currency: input.currency as Currency,
    status: "active" as const,
    createdAt: now,
    spendMinorUnits: 0,
    last4: fullNumber.slice(-4),
    cardReference: `ref_${crypto.randomUUID()}`,
    statusHistory: [{ status: "active" as const, changedAt: now }],
  }
  store.cards.unshift(card)
  const response = { card: safeCard(card), fullNumber }
  if (idempotencyKey)
    recentIssues.set(idempotencyKey, { createdAt: Date.now(), response })
  return NextResponse.json(response, { status: 201 })
}
