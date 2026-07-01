import { prisma } from "@/lib/db"
import { ComplianceRecorder, type ComplianceSummary, type RecorderState } from "rampart-ke"

/**
 * Persistent, PII-free redaction audit for the on-device privacy pipeline.
 *
 * rampart-ke's ComplianceRecorder stores only { label, day, count } — never any
 * value or text — so this audit log is itself free of personal data and safe to
 * retain and show the ODPC. State is kept per user in the AppData table.
 */

const APP = "privacy-compliance"

export async function getComplianceRecorder(userId: string): Promise<ComplianceRecorder> {
  const row = await prisma.appData.findUnique({ where: { userId_app: { userId, app: APP } } })
  const state = row?.data as RecorderState | undefined
  return state ? ComplianceRecorder.fromJSON(state) : new ComplianceRecorder()
}

export async function getComplianceSummary(userId: string): Promise<ComplianceSummary> {
  const recorder = await getComplianceRecorder(userId)
  return recorder.summary()
}

/** Record the placeholders introduced by one protect() call. Counts only. */
export async function recordRedactions(userId: string, placeholders: readonly string[]): Promise<void> {
  if (placeholders.length === 0) return
  const recorder = await getComplianceRecorder(userId)
  recorder.record({ placeholders })
  const data = recorder.toJSON() as unknown as object
  await prisma.appData.upsert({
    where: { userId_app: { userId, app: APP } },
    update: { data: data as any },
    create: { userId, app: APP, data: data as any },
  })
}
