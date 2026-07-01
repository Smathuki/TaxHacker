import { Transaction } from "@/prisma/client"

export type PeriodSummary = {
  currency: string
  outputVat: number
  inputVat: number
  netVat: number
  grossTurnoverIncome: number
  turnoverTaxDue: number
}

// Turnover Tax rate per the Finance Act 2024 (reduced from 3% to 1.5% of gross monthly sales)
export const TURNOVER_TAX_RATE = 0.015

function extraNumber(extra: Record<string, unknown>, key: string): number {
  const value = extra[key]
  if (typeof value === "number") return value
  const parsed = parseFloat(String(value ?? ""))
  return isNaN(parsed) ? 0 : parsed
}

export function summarizeTransactionsByCurrency(transactions: Transaction[]): Record<string, PeriodSummary> {
  const byCurrency: Record<string, PeriodSummary> = {}

  const ensure = (currency: string) => {
    if (!byCurrency[currency]) {
      byCurrency[currency] = {
        currency,
        outputVat: 0,
        inputVat: 0,
        netVat: 0,
        grossTurnoverIncome: 0,
        turnoverTaxDue: 0,
      }
    }
    return byCurrency[currency]
  }

  for (const transaction of transactions) {
    const currency = (transaction.currencyCode || "KES").toUpperCase()
    const extra = (transaction.extra ?? {}) as Record<string, unknown>
    const vat = extraNumber(extra, "vat")
    const summary = ensure(currency)

    if (transaction.type === "income") {
      summary.grossTurnoverIncome += (transaction.total || 0) / 100
      summary.outputVat += vat
    } else if (transaction.type === "expense") {
      summary.inputVat += vat
    }
  }

  for (const summary of Object.values(byCurrency)) {
    summary.netVat = summary.outputVat - summary.inputVat
    summary.turnoverTaxDue = summary.grossTurnoverIncome * TURNOVER_TAX_RATE
  }

  return byCurrency
}
