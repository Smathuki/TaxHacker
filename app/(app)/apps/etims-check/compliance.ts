import { Transaction } from "@/prisma/client"

export type ComplianceCheck = {
  code: string
  label: string
  passed: boolean
  detail: string
}

export type ComplianceResult = {
  transactionId: string
  isCompliant: boolean
  checks: ComplianceCheck[]
}

const KRA_PIN_REGEX = /^[A-Z]\d{9}[A-Z]$/
const VALID_TAX_CODES = ["A", "B", "C", "E"]

function extraString(extra: Record<string, unknown>, key: string): string {
  const value = extra[key]
  return typeof value === "string" ? value.trim() : ""
}

export function checkEtimsCompliance(transaction: Transaction): ComplianceResult {
  const extra = (transaction.extra ?? {}) as Record<string, unknown>

  const kraPinSeller = extraString(extra, "kra_pin_seller")
  const cuInvoiceNumber = extraString(extra, "cu_invoice_number")
  const etimsInvoiceNumber = extraString(extra, "etims_invoice_number")
  const taxCode = extraString(extra, "tax_code").toUpperCase()

  const checks: ComplianceCheck[] = [
    {
      code: "kra_pin_seller",
      label: "Seller KRA PIN",
      passed: KRA_PIN_REGEX.test(kraPinSeller),
      detail: !kraPinSeller
        ? "Not found on this transaction"
        : KRA_PIN_REGEX.test(kraPinSeller)
          ? `Valid format: ${kraPinSeller}`
          : `Found "${kraPinSeller}" but it doesn't match the KRA PIN format (e.g. A123456789Z)`,
    },
    {
      code: "invoice_number",
      label: "eTIMS / CU Invoice Number",
      passed: Boolean(cuInvoiceNumber || etimsInvoiceNumber),
      detail: cuInvoiceNumber
        ? `Control Unit invoice number: ${cuInvoiceNumber}`
        : etimsInvoiceNumber
          ? `eTIMS invoice number: ${etimsInvoiceNumber}`
          : "No eTIMS or Control Unit invoice number found",
    },
    {
      code: "tax_code",
      label: "Tax Code",
      passed: VALID_TAX_CODES.includes(taxCode),
      detail: !taxCode
        ? "Not found on this transaction"
        : VALID_TAX_CODES.includes(taxCode)
          ? `Tax code ${taxCode}`
          : `Found "${taxCode}" which is not one of A, B, C, E`,
    },
  ]

  return {
    transactionId: transaction.id,
    isCompliant: checks.every((check) => check.passed),
    checks,
  }
}
