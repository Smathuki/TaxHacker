"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createTransaction } from "@/models/transactions"
import { parse } from "@fast-csv/parse"
import { revalidatePath } from "next/cache"
import { MpesaParsedRow, parseMpesaRows } from "./parser"

export async function parseMpesaCsvAction(
  _prevState: ActionState<MpesaParsedRow[]> | null,
  formData: FormData
): Promise<ActionState<MpesaParsedRow[]>> {
  const file = formData.get("file") as File
  if (!file) {
    return { success: false, error: "No file uploaded" }
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { success: false, error: "Only CSV files are allowed. Export your M-Pesa statement as CSV first." }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const rawRows: string[][] = []

    const parser = parse()
      .on("data", (row) => rawRows.push(row))
      .on("error", (error) => {
        throw error
      })
    parser.write(buffer)
    parser.end()
    await new Promise((resolve) => parser.on("end", resolve))

    const parsedRows = parseMpesaRows(rawRows)
    if (parsedRows.length === 0) {
      return {
        success: false,
        error: "Couldn't find any M-Pesa transactions in this file. Make sure it's an unmodified M-Pesa statement CSV export.",
      }
    }

    const user = await getCurrentUser()
    const receiptNos = parsedRows.map((row) => row.receiptNo)
    const existing = await prisma.transaction.findMany({
      where: { userId: user.id, note: { in: receiptNos } },
      select: { note: true },
    })
    const existingNotes = new Set(existing.map((t) => t.note))

    const rowsWithDuplicateFlag = parsedRows.map((row) => ({
      ...row,
      isDuplicate: existingNotes.has(row.receiptNo),
    }))

    return { success: true, data: rowsWithDuplicateFlag }
  } catch (error) {
    console.error("Error parsing M-Pesa CSV:", error)
    return { success: false, error: "Failed to parse M-Pesa CSV file" }
  }
}

export async function saveMpesaTransactionsAction(
  _prevState: ActionState<{ imported: number }> | null,
  formData: FormData
): Promise<ActionState<{ imported: number }>> {
  const user = await getCurrentUser()

  try {
    const rows = JSON.parse(formData.get("rows") as string) as MpesaParsedRow[]
    let imported = 0

    for (const row of rows) {
      await createTransaction(user.id, {
        name: row.details || "M-Pesa transaction",
        merchant: row.details,
        note: row.receiptNo,
        total: Math.round(row.amount * 100),
        currencyCode: "KES",
        type: row.suggestedType,
        categoryCode: row.suggestedCategoryCode ?? undefined,
        issuedAt: row.completionTime ? new Date(row.completionTime) : undefined,
      })
      imported++
    }

    revalidatePath("/apps/mpesa-import")
    revalidatePath("/transactions")

    return { success: true, data: { imported } }
  } catch (error) {
    console.error("Error saving M-Pesa transactions:", error)
    return { success: false, error: "Failed to save transactions: " + error }
  }
}
