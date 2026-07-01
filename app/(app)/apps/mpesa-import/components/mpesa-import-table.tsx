"use client"

import { FormError } from "@/components/forms/error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Category } from "@/prisma/client"
import { Loader2, Play, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useMemo, useState } from "react"
import { parseMpesaCsvAction, saveMpesaTransactionsAction } from "../actions"
import { MpesaParsedRow } from "../parser"

const MAX_PREVIEW_ROWS = 200

export function MpesaImportTable({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [parseState, parseAction, isParsing] = useActionState(parseMpesaCsvAction, null)
  const [saveState, saveAction, isSaving] = useActionState(saveMpesaTransactionsAction, null)

  const [rows, setRows] = useState<(MpesaParsedRow & { include: boolean })[]>([])

  useEffect(() => {
    if (parseState?.success && parseState.data) {
      setRows(parseState.data.map((row) => ({ ...row, include: !row.isDuplicate })))
    }
  }, [parseState])

  useEffect(() => {
    if (saveState?.success) {
      router.push("/transactions")
    }
  }, [saveState, router])

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.code, c.name]))
    return (code: string | null) => (code ? map.get(code) || code : "Uncategorized")
  }, [categories])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    startTransition(async () => {
      await parseAction(formData)
    })
  }

  const toggleRow = (index: number) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, include: !row.include } : row)))
  }

  const handleSave = () => {
    const selected = rows.filter((row) => row.include)
    if (selected.length === 0) return

    const formData = new FormData()
    formData.append("rows", JSON.stringify(selected))
    startTransition(async () => {
      await saveAction(formData)
    })
  }

  const includedCount = rows.filter((row) => row.include).length
  const duplicateCount = rows.filter((row) => row.isDuplicate).length

  return (
    <>
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[400px]">
          <p className="text-muted-foreground">Upload an M-Pesa statement CSV export to import transactions</p>
          <div className="flex flex-row gap-5 mt-8">
            <div>
              <input type="file" accept=".csv" className="hidden" id="mpesa-file" onChange={handleFileChange} />
              <Button type="button" onClick={() => document.getElementById("mpesa-file")?.click()}>
                {isParsing ? "Parsing..." : <Upload className="mr-2" />} Import from M-Pesa CSV
              </Button>
            </div>
          </div>
          {parseState?.error && <FormError>{parseState.error}</FormError>}
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
            <h2 className="flex flex-row gap-3 md:gap-5">
              <span className="text-3xl font-bold tracking-tight">
                {rows.length} transactions found, {includedCount} selected
              </span>
            </h2>
            <Button onClick={handleSave} disabled={isSaving || includedCount === 0}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Play /> Import {includedCount} transactions
                </>
              )}
            </Button>
          </header>

          {saveState?.error && <FormError>{saveState.error}</FormError>}
          {duplicateCount > 0 && (
            <p className="text-muted-foreground mb-4">
              {duplicateCount} row(s) already exist (matched by M-Pesa receipt number) and are unchecked by default.
            </p>
          )}

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium"></th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Details</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Amount (KES)</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Category</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {rows.slice(0, MAX_PREVIEW_ROWS).map((row, index) => (
                    <tr
                      key={row.receiptNo + index}
                      className={`border-b transition-colors hover:bg-muted/50 ${!row.include ? "opacity-40" : ""}`}
                    >
                      <td className="p-4 align-middle">
                        <input type="checkbox" checked={row.include} onChange={() => toggleRow(index)} />
                      </td>
                      <td className="p-4 align-middle whitespace-nowrap">{row.completionTime}</td>
                      <td className="p-4 align-middle">{row.details}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={row.suggestedType === "income" ? "default" : "secondary"}>
                          {row.suggestedType}
                        </Badge>
                        {row.isDuplicate && (
                          <Badge variant="outline" className="ml-2">
                            duplicate
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 align-middle whitespace-nowrap">{row.amount.toFixed(2)}</td>
                      <td className="p-4 align-middle">{categoryName(row.suggestedCategoryCode)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {rows.length > MAX_PREVIEW_ROWS && (
            <p className="text-muted-foreground mt-4">and {rows.length - MAX_PREVIEW_ROWS} more entries...</p>
          )}
        </div>
      )}
    </>
  )
}
