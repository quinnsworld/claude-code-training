import { merchantById } from "@/data/merchants"
import { store } from "@/data/store"
import { formatDate } from "@/lib/dates"
import { formatMoney } from "@/lib/money"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = store.cards.find((item) => item.id === id)
  if (!card) notFound()
  const spendPercent = card.limitMinorUnits === 0 ? 0 : Math.min(100, (card.spendMinorUnits / card.limitMinorUnits) * 100)
  const widthClass = spendPercent === 0 ? "w-0" : spendPercent <= 25 ? "w-1/4" : spendPercent <= 50 ? "w-1/2" : spendPercent <= 75 ? "w-3/4" : "w-full"
  return (
    <section className="p-4 sm:p-6">
      <Link href="/cards" className="text-sm text-blue-600 hover:underline">← Back to cards</Link>
      <div className="mt-6 max-w-2xl">
        <div className="flex items-start justify-between">
          <div><p className="text-sm text-gray-500">Virtual card</p><h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{card.nickname}</h1></div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize dark:bg-gray-800">{card.status}</span>
        </div>
        <dl className="mt-8 grid gap-5 border-y border-gray-200 py-6 sm:grid-cols-2 dark:border-gray-800">
          <div><dt className="text-sm text-gray-500">Merchant</dt><dd className="mt-1 font-medium">{merchantById(card.merchantId)?.name}</dd></div>
          <div><dt className="text-sm text-gray-500">Category</dt><dd className="mt-1 font-medium capitalize">{card.merchantCategory}</dd></div>
          <div><dt className="text-sm text-gray-500">Card number</dt><dd className="mt-1 font-mono">•••• {card.last4}</dd></div>
          <div><dt className="text-sm text-gray-500">Spend limit</dt><dd className="mt-1 font-medium">{formatMoney(card.limitMinorUnits, card.currency)}</dd></div>
          <div><dt className="text-sm text-gray-500">Created</dt><dd className="mt-1">{formatDate(card.createdAt)}</dd></div>
        </dl>
        <div className="mt-8"><div className="flex justify-between text-sm"><span className="font-medium">Spend</span><span className="text-gray-500">{formatMoney(card.spendMinorUnits, card.currency)} of {formatMoney(card.limitMinorUnits, card.currency)}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"><div className={`${spendPercent > 80 ? "bg-amber-500" : "bg-blue-500"} h-full ${widthClass}`} /></div><p className="mt-2 text-sm text-gray-500">{spendPercent.toFixed(0)}% of limit used</p></div>
        <div className="mt-8"><h2 className="font-medium">Status history</h2><ul className="mt-2 space-y-1 text-sm text-gray-500">{card.statusHistory.map((event, index) => <li key={`${event.changedAt}-${index}`} className="capitalize">{event.status} · {formatDate(event.changedAt)}</li>)}</ul></div>
      </div>
    </section>
  )
}
