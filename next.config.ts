import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // TODO: make me linting again
  },
  images: {
    unoptimized: true, // FIXME: bug on prod, images always empty, investigate later
  },
  // On-device OCR + PII redaction (Florence-2 via @huggingface/transformers, rampart-ke)
  // ship native onnxruntime + wasm assets that must not be bundled by Turbopack/webpack.
  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-node",
    "@nationaldesignstudio/rampart",
    "rampart-ke",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "256mb",
    },
  },
}

const isSentryEnabled = process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT

export default isSentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: !process.env.CI,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      disableLogger: true,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
    })
  : nextConfig
