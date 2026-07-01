export type MpesaParsedRow = {
  receiptNo: string
  completionTime: string
  details: string
  transactionStatus: string
  paidIn: number
  withdrawn: number
  balance: number
  amount: number
  suggestedType: "income" | "expense"
  suggestedCategoryCode: string | null
  isDuplicate: boolean
}

function findColumnIndex(header: string[], matchers: string[]): number {
  return header.findIndex((col) => matchers.some((matcher) => col.trim().toLowerCase().includes(matcher)))
}

function parseAmount(value: string | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/,/g, "").trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export function guessCategory(details: string, type: "income" | "expense"): string | null {
  const text = details.toLowerCase()
  if (/charge|excise duty/.test(text)) return "mobile_money_charges"
  if (/pay\s*bill/.test(text)) return "utility_bills"
  if (/airtime|bundle/.test(text)) return "communication"
  if (/salary|salaries/.test(text)) return "salaries_paye"
  if (type === "income" && /(merchant payment|customer payment|till)/.test(text)) return "sales_vatable"
  return null
}

/**
 * Parses a standard M-Pesa statement CSV export (columns: Receipt No., Completion Time,
 * Details, Transaction Status, Paid In, Withdrawn, Balance). Statements typically include a
 * customer info preamble before the actual transaction table, so we locate the header row by
 * looking for its known column names rather than assuming row 0 is the header.
 */
export function parseMpesaRows(rawRows: string[][]): MpesaParsedRow[] {
  const headerIndex = rawRows.findIndex((row) => {
    const cells = row.map((cell) => cell.trim().toLowerCase())
    return cells.some((cell) => cell.includes("receipt no")) && cells.some((cell) => cell.includes("completion time"))
  })

  if (headerIndex === -1) {
    return []
  }

  const header = rawRows[headerIndex]
  const receiptIdx = findColumnIndex(header, ["receipt no"])
  const timeIdx = findColumnIndex(header, ["completion time"])
  const detailsIdx = findColumnIndex(header, ["details"])
  const statusIdx = findColumnIndex(header, ["transaction status", "status"])
  const paidInIdx = findColumnIndex(header, ["paid in"])
  const withdrawnIdx = findColumnIndex(header, ["withdrawn"])
  const balanceIdx = findColumnIndex(header, ["balance"])

  const results: MpesaParsedRow[] = []

  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i]
    const receiptNo = receiptIdx >= 0 ? (row[receiptIdx] || "").trim() : ""
    if (!receiptNo) continue // blank lines / trailing disclaimer text after the table

    const paidIn = parseAmount(paidInIdx >= 0 ? row[paidInIdx] : undefined)
    const withdrawn = parseAmount(withdrawnIdx >= 0 ? row[withdrawnIdx] : undefined)
    const amount = paidIn > 0 ? paidIn : withdrawn
    if (amount === 0) continue

    const details = detailsIdx >= 0 ? (row[detailsIdx] || "").trim() : ""
    const suggestedType: "income" | "expense" = paidIn > 0 ? "income" : "expense"

    results.push({
      receiptNo,
      completionTime: timeIdx >= 0 ? (row[timeIdx] || "").trim() : "",
      details,
      transactionStatus: statusIdx >= 0 ? (row[statusIdx] || "").trim() : "",
      paidIn,
      withdrawn,
      balance: parseAmount(balanceIdx >= 0 ? row[balanceIdx] : undefined),
      amount,
      suggestedType,
      suggestedCategoryCode: guessCategory(details, suggestedType),
      isDuplicate: false,
    })
  }

  return results
}
