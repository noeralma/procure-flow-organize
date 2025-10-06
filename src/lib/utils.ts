import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utility shared across frontend components
export function formatCurrency(
  amount: string | number | null | undefined,
  currency: string = "IDR",
  locale: string = "id-ID"
) {
  if (amount === null || amount === undefined || amount === "") return "-"
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(Number(numeric))) return "-"

  const symbol = currency === "USD" ? "$" : "Rp "
  return `${symbol}${Number(numeric).toLocaleString(locale)}`
}
