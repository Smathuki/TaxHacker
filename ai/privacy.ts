import { createKenyanGuard, KenyanGuard } from "rampart-ke"

/**
 * On-device PII redaction wrapper around rampart-ke.
 *
 * The privacy pipeline OCRs a receipt locally, redacts Kenyan PII here, sends
 * only placeholdered text to the (cloud or local) text LLM, then restores the
 * real values locally with {@link revealDeep}. The LLM never sees the image or
 * raw PII (KRA PIN, M-Pesa codes, phone, national ID, SHIF/NSSF, bank, org).
 *
 * We default to the deterministic Kenyan recognizer layer (`heuristicsOnly`),
 * which is lossless — every non-PII character (amounts, dates, VAT labels) is
 * preserved so the LLM can still extract from it. The upstream NER model path
 * (names/addresses) currently has a span-merge bug that can drop text between
 * detected entities, so it is opt-in and guarded by a losslessness check.
 */

export type ProtectResult = {
  guard: KenyanGuard
  maskedText: string
  placeholders: readonly string[]
}

export type ProtectOptions = {
  /** Also run the on-device NER model for names/addresses (default false). */
  useModel?: boolean
}

/**
 * Redact Kenyan PII in `text`. Returns the masked text plus the guard instance
 * needed to {@link revealDeep} the LLM's structured output afterwards.
 *
 * Guarantees losslessness: if a chosen path fails `reveal(masked) === original`
 * (e.g. the NER model drops text), it falls back to the deterministic layer.
 */
export async function protectText(text: string, options: ProtectOptions = {}): Promise<ProtectResult> {
  if (options.useModel) {
    const guard = await createKenyanGuard({ device: "cpu" })
    const result = await guard.protect(text)
    if (guard.reveal(result.text) === text) {
      return { guard, maskedText: result.text, placeholders: result.placeholders }
    }
    // NER path corrupted the text — fall through to the safe deterministic layer.
    console.warn("rampart-ke NER path was not lossless; falling back to deterministic redaction")
  }

  const guard = await createKenyanGuard({ heuristicsOnly: true })
  const result = await guard.protect(text)
  return { guard, maskedText: result.text, placeholders: result.placeholders }
}

/**
 * Recursively restore real PII values in a value returned by the LLM. Applies
 * `guard.reveal()` to every string; leaves numbers, booleans and null intact.
 * Handles the nested `items[]` array and any custom string fields.
 */
export function revealDeep<T>(guard: KenyanGuard, value: T): T {
  if (typeof value === "string") {
    return guard.reveal(value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => revealDeep(guard, item)) as unknown as T
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = revealDeep(guard, val)
    }
    return out as unknown as T
  }
  return value
}
