"use server"

import { ActionState } from "@/lib/actions"
import { updateFile } from "@/models/files"
import { recordRedactions } from "@/models/compliance"
import { getLLMSettings, getSettings } from "@/models/settings"
import { AnalyzeAttachment } from "./attachments"
import { ocrAttachments } from "./ocr"
import { protectText, revealDeep } from "./privacy"
import { requestLLM } from "./providers/llmProvider"

export type AnalysisResult = {
  output: Record<string, string>
  tokensUsed: number
}

/**
 * Return a copy of a fieldsToJsonSchema() schema without one property, removed
 * from `properties`/`required` at the top level and inside `items`.
 */
function pruneSchemaProperty(schema: Record<string, unknown>, key: string): Record<string, unknown> {
  const clone = structuredClone(schema) as any
  for (const level of [clone, clone?.properties?.items?.items]) {
    if (!level?.properties) continue
    delete level.properties[key]
    if (Array.isArray(level.required)) {
      level.required = level.required.filter((name: string) => name !== key)
    }
  }
  return clone
}

export async function analyzeTransaction(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  fileId: string,
  userId: string
): Promise<ActionState<AnalysisResult>> {
  const settings = await getSettings(userId)
  const llmSettings = getLLMSettings(settings)

  try {
    if (settings.privacy_pipeline_enabled === "true") {
      return await analyzeTransactionPrivate(prompt, schema, attachments, fileId, userId, settings, llmSettings)
    }

    const response = await requestLLM(llmSettings, {
      prompt,
      schema,
      attachments,
    })

    if (response.error) {
      throw new Error(response.error)
    }

    const result = response.output
    const tokensUsed = response.tokensUsed || 0

    console.log("LLM response:", result)
    console.log("LLM tokens used:", tokensUsed)

    await updateFile(fileId, userId, { cachedParseResult: result })

    return {
      success: true,
      data: {
        output: result,
        tokensUsed: tokensUsed,
      },
    }
  } catch (error) {
    console.error("AI Analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}

/**
 * Privacy-preserving pipeline: OCR the receipt on-device, redact Kenyan PII
 * on-device, send only placeholdered text to the (cloud or local) text LLM,
 * then restore the real values locally. The LLM never sees the image or raw PII.
 */
async function analyzeTransactionPrivate(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  fileId: string,
  userId: string,
  settings: Record<string, string>,
  llmSettings: ReturnType<typeof getLLMSettings>
): Promise<ActionState<AnalysisResult>> {
  // 1. On-device OCR — image never leaves the server.
  const rawText = await ocrAttachments(attachments, settings.ocr_model_name)
  if (!rawText.trim()) {
    return {
      success: false,
      error:
        "On-device OCR couldn't read any text from this document. Try a clearer scan, or turn off the privacy pipeline in settings to use cloud vision.",
    }
  }

  // 2. On-device PII redaction — only placeholdered text will leave the device.
  const { guard, maskedText, placeholders } = await protectText(rawText)

  // 3. Text-only LLM extraction (no image, no raw PII in the request). We
  // already hold the full OCR text locally, so don't ask the model to re-emit
  // the "text" field — grammar-constrained small local models tend to loop on
  // that open-ended string, generating for minutes.
  const response = await requestLLM(llmSettings, {
    prompt: `${prompt}\n\n--- Document OCR text (personal data already redacted) ---\n${maskedText}`,
    schema: pruneSchemaProperty(schema, "text"),
    attachments: [],
  })
  if (response.error) {
    throw new Error(response.error)
  }

  // 4. Restore the real PII values locally, in the structured output, and fill
  // the "text" field from the on-device OCR instead of the model.
  const output = revealDeep(guard, response.output)
  output.text = rawText

  // 5. PII-free audit for the ODPC compliance report.
  await recordRedactions(userId, placeholders)

  await updateFile(fileId, userId, { cachedParseResult: output })

  return {
    success: true,
    data: {
      output,
      tokensUsed: response.tokensUsed || 0,
    },
  }
}
