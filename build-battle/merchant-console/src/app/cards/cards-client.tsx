"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { merchantById, merchants } from "@/data/merchants"
import { formatDate } from "@/lib/dates"
import { formatMoney } from "@/lib/money"
import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"

type Card = {
  id: string
  nickname: string
  merchantId: string
  limitMinorUnits: number
  currency: "USD" | "EUR" | "GBP"
  status: "active" | "frozen" | "cancelled"
  createdAt: string
  spendMinorUnits: number
  last4: string
  maskedNumber: string
}

export function CardsClient() {
  const [cards, setCards] = useState<Card[]>([])
  const [nickname, setNickname] = useState("")
  const [merchantId, setMerchantId] = useState(merchants[0].id)
  const [limit, setLimit] = useState("")
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP">("USD")
  const [error, setError] = useState("")
  const [reveal, setReveal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadCards() {
    const response = await fetch("/api/cards", { cache: "no-store" })
    if (response.ok) setCards(await response.json())
  }

  useEffect(() => { void loadCards() }, [])

  async function issueCard(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    const response = await fetch("/api/cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname, merchantId, limitMinorUnits: Math.round(Number(limit) * 100), currency }),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) { setError(body.message ?? "Could not issue card"); return }
    setCards((current) => [body.card, ...current])
    setReveal(body.fullNumber)
    setNickname("")
    setLimit("")
  }

  async function changeStatus(card: Card) {
    const next = card.status === "active" ? "frozen" : "active"
    const response = await fetch(`/api/cards/${card.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) })
    if (response.ok) {
      const updated = await response.json()
      setCards((current) => current.map((item) => item.id === updated.id ? updated : item))
    }
  }

  return <section aria-label="Virtual cards" className="p-4 sm:p-6">
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div><h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Virtual cards</h1><p className="text-sm text-gray-500">Issue and monitor cards for merchant operations.</p></div>
      <Button onClick={() => document.getElementById("issue-card")?.scrollIntoView({ behavior: "smooth" })}>Issue card</Button>
    </div>
    {reveal && <div role="status" className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-950"><p className="font-semibold">Card issued. Reveal this number now—it will not be shown again.</p><p className="mt-2 font-mono text-lg tracking-widest">{reveal}</p><Button className="mt-3" variant="secondary" onClick={() => setReveal(null)}>Close reveal</Button></div>}
    <form id="issue-card" onSubmit={issueCard} className="mb-8 grid gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-sm font-medium">Nickname<Input required value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ad spend card" /></label>
      <label className="text-sm font-medium">Merchant<select className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950" value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}</select></label>
      <label className="text-sm font-medium">Spend limit<Input required min="0.01" step="0.01" type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="250.00" /></label>
      <label className="text-sm font-medium">Currency<select className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950" value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)}><option>USD</option><option>EUR</option><option>GBP</option></select></label>
      <div className="flex items-end"><Button type="submit" isLoading={loading} className="w-full">Create card</Button></div>
      {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2 lg:col-span-5">{error}</p>}
    </form>
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900"><tr>{["Nickname", "Merchant", "Number", "Limit", "Status", "Created", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>
        {cards.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No virtual cards yet. Issue the first card above.</td></tr>}
        {cards.map((card) => <tr key={card.id} className="border-b border-gray-100 last:border-0 dark:border-gray-900"><td className="px-4 py-3 font-medium"><Link className="text-blue-600 hover:underline" href={`/cards/${card.id}`}>{card.nickname}</Link></td><td className="px-4 py-3">{merchantById(card.merchantId)?.name}</td><td className="px-4 py-3 font-mono">{card.maskedNumber}</td><td className="px-4 py-3">{formatMoney(card.limitMinorUnits, card.currency)}</td><td className="px-4 py-3 capitalize">{card.status}</td><td className="px-4 py-3 text-gray-500">{formatDate(card.createdAt)}</td><td className="px-4 py-3">{card.status !== "cancelled" && <Button variant="secondary" className="py-1" onClick={() => void changeStatus(card)}>{card.status === "active" ? "Freeze" : "Unfreeze"}</Button>}</td></tr>)}
      </tbody></table>
    </div>
  </section>
}
