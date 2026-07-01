import type { AnalyzeAttachment } from "./attachments"

/**
 * On-device OCR for the privacy pipeline.
 *
 * Runs a small Hugging Face vision model (Florence-2 by default) locally via
 * @huggingface/transformers (onnxruntime) to turn a receipt image into plain
 * text — entirely on the server, so the image never reaches a cloud AI API.
 * The extracted text is then PII-redacted (see ./privacy) before any LLM call.
 *
 * The model (~hundreds of MB) downloads once and is cached to OCR_MODEL_CACHE
 * (default ./.model-cache); the pipeline instance is memoised per model id.
 */

// Loaded lazily so the heavy native/onnx deps never load unless privacy mode runs.
type Florence = {
  model: any
  processor: any
  tokenizer: any
}

// OCR_WITH_REGION returns text segmented by layout region, which we join with
// newlines. Plain <OCR> concatenates everything with no separators, which glues
// tokens together and defeats the boundary/context-anchored PII recognizers
// (e.g. a phone number fused to the next word is not recognised → it would leak).
const OCR_TASK = "<OCR_WITH_REGION>"
const DEFAULT_MODEL = "onnx-community/Florence-2-base-ft"
// fp32 is the most portable on CPU; override to "q8"/"fp16" for a lighter/faster footprint.
const OCR_DTYPE = process.env.OCR_DTYPE || "fp32"

const cache = new Map<string, Promise<Florence>>()

async function getFlorence(modelId: string): Promise<Florence> {
  let pending = cache.get(modelId)
  if (!pending) {
    pending = loadFlorence(modelId)
    cache.set(modelId, pending)
  }
  return pending
}

async function loadFlorence(modelId: string): Promise<Florence> {
  const { Florence2ForConditionalGeneration, AutoProcessor, AutoTokenizer, env } = await import(
    "@huggingface/transformers"
  )
  if (process.env.OCR_MODEL_CACHE) {
    env.cacheDir = process.env.OCR_MODEL_CACHE
  }
  const [model, processor, tokenizer] = await Promise.all([
    Florence2ForConditionalGeneration.from_pretrained(modelId, { dtype: OCR_DTYPE as any }),
    AutoProcessor.from_pretrained(modelId),
    AutoTokenizer.from_pretrained(modelId),
  ])
  return { model, processor, tokenizer }
}

async function ocrOneImage(florence: Florence, base64: string, contentType: string): Promise<string> {
  const { RawImage } = await import("@huggingface/transformers")
  const { model, processor, tokenizer } = florence

  const buffer = Buffer.from(base64, "base64")
  const image = await RawImage.fromBlob(new Blob([buffer], { type: contentType || "image/png" }))

  const prompts = processor.construct_prompts(OCR_TASK)
  const inputs = await processor(image, prompts)

  const generated_ids = await model.generate({ ...inputs, max_new_tokens: 1024 })
  const generated_text = tokenizer.batch_decode(generated_ids, { skip_special_tokens: false })[0]
  const parsed = processor.post_process_generation(generated_text, OCR_TASK, image.size)
  const result = parsed?.[OCR_TASK]

  // <OCR_WITH_REGION> returns { quad_boxes, labels }; join the per-region labels
  // with newlines so each field is a separate, boundary-delimited token.
  if (result && Array.isArray(result.labels)) {
    return result.labels
      .map((label: string) => label.replace(/<\/?s>/g, "").trim())
      .filter(Boolean)
      .join("\n")
  }
  // Fallback for plain <OCR> which returns a bare string.
  return typeof result === "string" ? result : ""
}

/**
 * OCR every attachment (already base64 page images from loadAttachmentsForAI)
 * and concatenate the page text. Returns "" if nothing was recognised.
 */
export async function ocrAttachments(
  attachments: AnalyzeAttachment[],
  modelId: string = DEFAULT_MODEL
): Promise<string> {
  const florence = await getFlorence(modelId || DEFAULT_MODEL)
  const pages: string[] = []
  for (const att of attachments) {
    const text = await ocrOneImage(florence, att.base64, att.contentType)
    if (text.trim()) pages.push(text.trim())
  }
  return pages.join("\n\n")
}
