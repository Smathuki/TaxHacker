import { execSync } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import { afterAll, describe, expect, it } from "vitest"

// The OCR model is ~hundreds of MB and takes seconds to run, so this end-to-end
// test only runs when explicitly requested: OCR_E2E=1 npm test
const runE2E = process.env.OCR_E2E === "1"

describe.runIf(runE2E)("ocrAttachments (Florence-2, on-device)", () => {
  const imagePath = path.join(os.tmpdir(), "ocr_e2e_receipt.png")

  afterAll(() => {
    try {
      fs.unlinkSync(imagePath)
    } catch {
      /* ignore */
    }
  })

  it("extracts text from a synthetic receipt image", async () => {
    // Render a receipt with GraphicsMagick (installed for PDF processing).
    execSync(
      `gm convert -size 640x220 xc:white -fill black -pointsize 26 ` +
        `-draw "text 30,50 'NAIVAS SUPERMARKET LTD'" ` +
        `-draw "text 30,110 'TOTAL 429.20'" ` +
        `-draw "text 30,170 'VAT 16 percent'" ` +
        `"${imagePath}"`
    )
    const base64 = fs.readFileSync(imagePath).toString("base64")

    const { ocrAttachments } = await import("./ocr")
    const text = await ocrAttachments([{ filename: "r.png", contentType: "image/png", base64 }])

    expect(text.trim().length).toBeGreaterThan(0)
    expect(text.toUpperCase()).toContain("NAIVAS")
    expect(text).toContain("429.20")
  }, 300_000)
})
