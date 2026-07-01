import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { getTransactions } from "@/models/transactions"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { Info } from "lucide-react"
import { manifest } from "./manifest"
import { summarizeTransactionsByCurrency, TURNOVER_TAX_RATE } from "./summary"

export default async function TaxReportsApp({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()

  const now = new Date()
  const dateFrom = params.dateFrom || format(startOfMonth(now), "yyyy-MM-dd")
  const dateTo = params.dateTo || format(endOfMonth(now), "yyyy-MM-dd")

  const { transactions } = await getTransactions(user.id, { dateFrom, dateTo })
  const summaries = Object.values(summarizeTransactionsByCurrency(transactions))

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.icon} {manifest.name}
          </span>
        </h2>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-4 mb-6">
        <label className="flex flex-col gap-1 text-sm">
          From
          <input type="date" name="dateFrom" defaultValue={dateFrom} className="border rounded-md p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          To
          <input type="date" name="dateTo" defaultValue={dateTo} className="border rounded-md p-2" />
        </label>
        <button type="submit" className="border rounded-md px-4 py-2 bg-primary text-primary-foreground">
          Update period
        </button>
      </form>

      <Alert className="mb-6">
        <Info className="h-4 w-4 mt-2" />
        <div className="pt-2">
          <AlertTitle>VAT and Turnover Tax are mutually exclusive</AlertTitle>
          <AlertDescription>
            Only VAT-registered businesses file a VAT return; Turnover Tax (1.5% of gross sales, Finance Act 2024)
            applies to non-VAT-registered businesses with turnover between KES 1M and 25M/year. These figures are
            computed from the VAT and total fields on your transactions &mdash; always confirm against your own
            records before filing on iTax.
          </AlertDescription>
        </div>
      </Alert>

      {summaries.length === 0 && (
        <p className="text-muted-foreground">No transactions found for {dateFrom} to {dateTo}.</p>
      )}

      <div className="flex flex-col gap-6">
        {summaries.map((summary) => (
          <div key={summary.currency} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 flex flex-col gap-3">
              <h3 className="text-xl font-semibold">VAT Return Summary ({summary.currency})</h3>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output VAT (on sales)</span>
                <span>{formatCurrency(Math.round(summary.outputVat * 100), summary.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Input VAT (on purchases)</span>
                <span>{formatCurrency(Math.round(summary.inputVat * 100), summary.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>{summary.netVat >= 0 ? "Net VAT payable" : "Net VAT refundable"}</span>
                <span>{formatCurrency(Math.round(Math.abs(summary.netVat) * 100), summary.currency)}</span>
              </div>
            </Card>

            <Card className="p-5 flex flex-col gap-3">
              <h3 className="text-xl font-semibold">Turnover Tax Summary ({summary.currency})</h3>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross turnover (income)</span>
                <span>{formatCurrency(Math.round(summary.grossTurnoverIncome * 100), summary.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Turnover Tax due ({(TURNOVER_TAX_RATE * 100).toFixed(1)}%)</span>
                <span>{formatCurrency(Math.round(summary.turnoverTaxDue * 100), summary.currency)}</span>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
