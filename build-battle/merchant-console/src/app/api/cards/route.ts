import { generateTestCardNumber, safeCard, validateCardInput } from "@/data/cards"
import { merchantById } from "@/data/merchants"
import { store } from "@/data/store"
import { Currency } from "@/data/types"
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(store.cards.map(safeCard))
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const input = {
    nickname: body?.nickname,
    merchantId: body?.merchantId,
    limitMinorUnits: body?.limitMinorUnits,
    currency: body?.currency,
  }
  const error = validateCardInput(input)
  if (error) return NextResponse.json({ message: error }, { status: 400 })
  if (!merchantById(input.merchantId as string)) {
    return NextResponse.json({ message: "Merchant was not found" }, { status: 400 })
  }

  const fullNumber = generateTestCardNumber()
  const card = {
    id: `vcard_${crypto.randomUUID().slice(0, 8)}`,
    nickname: (input.nickname as string).trim(),
    merchantId: input.merchantId as string,
    limitMinorUnits: input.limitMinorUnits as number,
    currency: input.currency as Currency,
    status: "active" as const,
    createdAt: new Date().toISOString(),
    spendMinorUnits: 0,
    last4: fullNumber.slice(-4),
    cardReference: `ref_${crypto.randomUUID()}`,
  }
  store.cards.unshift(card)
  return NextResponse.json({ card: safeCard(card), fullNumber }, { status: 201 })
}
