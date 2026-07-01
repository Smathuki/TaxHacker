import { describe, expect, it } from "vitest"
import { protectText, revealDeep } from "./privacy"

// A synthetic Kenyan receipt line with several structured identifiers. No real
// personal data (per rampart-ke's contributing rule).
const RECEIPT_TEXT =
  "M-PESA QFT3X1AB9Z Confirmed. Ksh2,500 paid to Naivas Ltd. Buyer KRA PIN A012345678Z. " +
  "Till 832910. Call 0712345678. Total 2500, VAT 344.83."

describe("protectText (deterministic layer)", () => {
  it("masks the high-value Kenyan identifiers", async () => {
    const { maskedText } = await protectText(RECEIPT_TEXT)
    // Raw PII must not survive into the text that would be sent to the LLM.
    expect(maskedText).not.toContain("QFT3X1AB9Z")
    expect(maskedText).not.toContain("A012345678Z")
    expect(maskedText).not.toContain("832910")
    expect(maskedText).not.toContain("0712345678")
    // Placeholders are present instead.
    expect(maskedText).toMatch(/\[KRA_PIN_\d+\]/)
    expect(maskedText).toMatch(/\[MPESA_CODE_\d+\]/)
    expect(maskedText).toMatch(/\[KE_PHONE_\d+\]/)
  })

  it("is lossless — non-PII content (amounts, VAT) is preserved", async () => {
    const { guard, maskedText } = await protectText(RECEIPT_TEXT)
    // Amounts and tax figures are not PII and must remain for extraction.
    expect(maskedText).toContain("2500")
    expect(maskedText).toContain("VAT 344.83")
    // reveal(masked) reconstructs the exact original.
    expect(guard.reveal(maskedText)).toBe(RECEIPT_TEXT)
  })

  it("revealDeep restores PII across nested structured output including items[]", async () => {
    const { guard } = await protectText(RECEIPT_TEXT)
    // Simulate an LLM structured result that echoed placeholders in string fields.
    const { maskedText } = await protectText("Buyer KRA PIN A012345678Z")
    const kraPlaceholder = maskedText.match(/\[KRA_PIN_\d+\]/)?.[0]
    expect(kraPlaceholder).toBeTruthy()

    // Build a fresh guard/table for a self-contained round-trip.
    const p = await protectText("Naivas Ltd sold to us; KRA PIN A012345678Z; phone 0712345678")
    const merchantPh = p.maskedText.match(/\[ORG_KE_\d+\]/)?.[0]
    const pinPh = p.maskedText.match(/\[KRA_PIN_\d+\]/)?.[0]
    const phonePh = p.maskedText.match(/\[KE_PHONE_\d+\]/)?.[0]

    const llmOutput = {
      merchant: merchantPh,
      total: 2500, // number stays a number
      kra_pin_seller: pinPh,
      items: [{ name: `Sold by ${merchantPh}`, phone: phonePh, price: 2500 }],
    }

    const revealed = revealDeep(p.guard, llmOutput)
    expect(revealed.merchant).toBe("Naivas Ltd")
    expect(revealed.kra_pin_seller).toBe("A012345678Z")
    expect(revealed.total).toBe(2500) // untouched
    expect(revealed.items[0].name).toBe("Sold by Naivas Ltd")
    expect(revealed.items[0].phone).toBe("0712345678")
    expect(revealed.items[0].price).toBe(2500)
  })
})
