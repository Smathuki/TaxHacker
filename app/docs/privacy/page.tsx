import Link from "next/link"

export default async function PrivacyPipelineDoc() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
        On-device privacy pipeline (KRA PII redaction)
      </h1>

      <p className="text-gray-700 leading-relaxed mb-6">
        When the privacy pipeline is enabled, TaxHacker Kenya reads your receipts with a local OCR model and redacts
        Kenyan personal data <strong>on your own server</strong> before any text is sent to an AI model. The AI never
        receives the receipt image, and never sees raw personal data.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">How it works</h2>
      <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm overflow-x-auto">{`receipt image
  → on-device OCR (Hugging Face model, runs locally)      → raw text
  → rampart-ke redaction (KRA PIN, M-Pesa, phone, ID …)   → placeholdered text
  → text LLM (cheap cloud OR fully local via Ollama)      → structured fields
  → local reveal()                                        → real values restored
  → saved to your database`}</pre>
      <p className="text-gray-700 leading-relaxed mb-6">
        Amounts, dates and VAT figures are not personal data, so they pass through untouched and are still extracted
        accurately. Identifiers like KRA PINs, M-Pesa codes, phone numbers and national IDs are replaced with
        placeholders such as <code>[KRA_PIN_1]</code> before the AI call, then restored locally afterwards.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Why it matters (Data Protection Act, 2019)</h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        Kenya&apos;s{" "}
        <Link href="https://www.odpc.go.ke/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
          Data Protection Act, 2019
        </Link>{" "}
        expects data handlers to minimise and protect personal data. The surest way to keep sensitive data in-country
        is to never send it out in the first place. With the privacy pipeline, raw personal data never leaves your
        server, and the <Link href="/apps/privacy-compliance" className="text-blue-600 hover:text-blue-800">Data
        Protection</Link> app produces a PII-free, ODPC-style report of how much was redacted — evidence you can keep
        without creating new liability.
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Trade-offs</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
        <li>
          Local OCR is lighter and private but less accurate than a large cloud vision model, especially on faded
          thermal or skewed photos. You can switch the OCR model in settings, or turn the pipeline off to use cloud
          vision when you need maximum accuracy.
        </li>
        <li>The OCR model (a few hundred MB) downloads once on first use and is then cached and fully offline.</li>
        <li>
          For a zero-cloud setup, point the text step at a local model (Ollama / LM Studio) via the OpenAI-compatible
          provider — then nothing leaves your machine at all.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Attribution</h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        PII redaction is powered by{" "}
        <Link href="https://github.com/Smathuki/rampart-ke" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
          rampart-ke
        </Link>
        , a Kenya-localized layer over{" "}
        <Link href="https://huggingface.co/nationaldesignstudio/rampart" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
          Rampart
        </Link>{" "}
        by National Design Studio, used under CC BY 4.0.
      </p>
    </div>
  )
}
