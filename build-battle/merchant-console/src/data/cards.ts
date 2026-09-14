import { Currency, VirtualCard, VirtualCardStatus } from "./types"

export const MAX_LIMIT_MINOR_UNITS = 5_000_000
export const CARD_CATEGORIES = [
  "advertising",
  "software",
  "travel",
  "supplies",
  "other",
] as const
export type CardCategory = (typeof CARD_CATEGORIES)[number]
const CURRENCIES: Currency[] = ["USD", "EUR", "GBP"]

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && CURRENCIES.includes(value as Currency)
}

export function isCardCategory(value: unknown): value is CardCategory {
  return (
    typeof value === "string" && CARD_CATEGORIES.includes(value as CardCategory)
  )
}

export function validateCardInput(input: {
  nickname?: unknown
  merchantId?: unknown
  limitMinorUnits?: unknown
  currency?: unknown
  merchantCategory?: unknown
}): string | null {
  if (typeof input.nickname !== "string" || !input.nickname.trim())
    return "Nickname is required"
  if (typeof input.merchantId !== "string" || !input.merchantId.trim())
    return "Merchant is required"
  if (
    !Number.isSafeInteger(input.limitMinorUnits) ||
    (input.limitMinorUnits as number) <= 0
  )
    return "Spend limit must be a positive integer in minor units"
  if ((input.limitMinorUnits as number) > MAX_LIMIT_MINOR_UNITS)
    return "Spend limit cannot exceed 5,000,000 minor units"
  if (!isCurrency(input.currency)) return "Currency must be USD, EUR, or GBP"
  if (!isCardCategory(input.merchantCategory))
    return "Merchant category is required"
  return null
}

export function canTransitionStatus(
  from: VirtualCardStatus,
  to: VirtualCardStatus,
): boolean {
  if (from === "cancelled") return false
  if (to === "cancelled") return true
  return (
    (from === "active" && to === "frozen") ||
    (from === "frozen" && to === "active")
  )
}

export function maskCard(last4: string): string {
  return `•••• ${last4}`
}

export function safeCard(card: VirtualCard) {
  const {
    id,
    nickname,
    merchantId,
    merchantCategory,
    limitMinorUnits,
    currency,
    status,
    createdAt,
    spendMinorUnits,
    last4,
    cardReference,
    statusHistory,
  } = card
  return {
    id,
    nickname,
    merchantId,
    merchantCategory,
    limitMinorUnits,
    currency,
    status,
    createdAt,
    spendMinorUnits,
    last4,
    cardReference,
    statusHistory,
    maskedNumber: maskCard(last4),
  }
}

function luhnCheckDigit(prefix: string): number {
  let sum = 0
  const digits = prefix.split("").map(Number)
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = digits[i]
    if ((digits.length - i) % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return (10 - (sum % 10)) % 10
}

export function generateTestCardNumber(random = Math.random): string {
  let prefix = "4242"
  while (prefix.length < 15) prefix += Math.floor(random() * 10).toString()
  return prefix + luhnCheckDigit(prefix).toString()
}

export function isValidLuhn(number: string): boolean {
  if (!/^\d{16}$/.test(number)) return false
  let sum = 0
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let digit = Number(number[i])
    if ((number.length - i) % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}
