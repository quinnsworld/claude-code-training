import { safeCard, canTransitionStatus } from "@/data/cards"
import { store } from "@/data/store"
import { VirtualCardStatus } from "@/data/types"
import { NextResponse } from "next/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = store.cards.find((item) => item.id === id)
  if (!card) return NextResponse.json({ message: "Card not found" }, { status: 404 })
  return NextResponse.json(safeCard(card))
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = store.cards.find((item) => item.id === id)
  if (!card) return NextResponse.json({ message: "Card not found" }, { status: 404 })
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null
  const next = body?.status
  if (next !== "active" && next !== "frozen" && next !== "cancelled") {
    return NextResponse.json({ message: "Invalid card status" }, { status: 400 })
  }
  if (!canTransitionStatus(card.status, next as VirtualCardStatus)) {
    return NextResponse.json({ message: `Cannot move ${card.status} card to ${next}` }, { status: 409 })
  }
  card.status = next as VirtualCardStatus
  return NextResponse.json(safeCard(card))
}
