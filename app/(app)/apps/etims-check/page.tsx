import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { getTransactions } from "@/models/transactions"
import { CheckCircle2, ExternalLink, ShieldAlert, XCircle } from "lucide-react"
import Link from "next/link"
import { checkEtimsCompliance } from "./compliance"
import { manifest } from "./manifest"

const ITAX_INVOICE_CHECKER_URL = "https://ecitizen.kra.go.ke/checkers/Checkers-Invoice-No"

export default async function EtimsCheckApp() {
  const user = await getCurrentUser()
  const { transactions } = await getTransactions(user.id, { type: "expense" })

  const results = transactions.map((transaction) => ({
    transaction,
    result: checkEtimsCompliance(transaction),
  }))

  const nonCompliant = results.filter((r) => !r.result.isCompliant)
  const compliant = results.filter((r) => r.result.isCompliant)

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.icon} {manifest.name}
          </span>
          <span className="text-3xl tracking-tight opacity-20">{transactions.length}</span>
        </h2>
      </header>

      <Alert className="mb-6">
        <ShieldAlert className="h-4 w-4 mt-2" />
        <div className="pt-2">
          <AlertTitle>This is a format pre-check, not an official KRA verification</AlertTitle>
          <AlertDescription>
            It only checks whether a KRA PIN, eTIMS/Control Unit invoice number and tax code were extracted from each
            expense. It cannot confirm an invoice is genuine. To verify a specific invoice with KRA, use the{" "}
            <Link
              href={ITAX_INVOICE_CHECKER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              iTax invoice checker <ExternalLink className="w-3 h-3" />
            </Link>
            . See the{" "}
            <Link href="/docs/kenya-tax" className="underline">
              Kenya Tax Guide
            </Link>{" "}
            for more on eTIMS requirements.
          </AlertDescription>
        </div>
      </Alert>

      <div className="flex flex-row gap-4 mb-6">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Missing eTIMS fields</span>
          <span className="text-2xl font-bold">{nonCompliant.length}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Looks compliant</span>
          <span className="text-2xl font-bold">{compliant.length}</span>
        </Card>
      </div>

      {nonCompliant.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12" />
          <p>All expense transactions have KRA PIN, invoice number and tax code recorded.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Missing / invalid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonCompliant.map(({ transaction, result }) => (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                    {transaction.issuedAt ? new Date(transaction.issuedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/transactions/${transaction.id}`} className="underline">
                      {transaction.merchant || transaction.name || "Unnamed transaction"}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {transaction.total ? formatCurrency(transaction.total, transaction.currencyCode || "KES") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {result.checks
                        .filter((check) => !check.passed)
                        .map((check) => (
                          <Badge key={check.code} variant="destructive" className="w-fit gap-1">
                            <XCircle className="w-3 h-3" />
                            {check.label}: {check.detail}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
