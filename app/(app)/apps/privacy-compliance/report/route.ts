import { getCurrentUser } from "@/lib/auth"
import { getComplianceSummary } from "@/models/compliance"
import { generateComplianceReport } from "rampart-ke"
import { NextResponse } from "next/server"

export async function GET() {
  const user = await getCurrentUser()
  const summary = await getComplianceSummary(user.id)
  const { html } = generateComplianceReport(summary, {
    organisation: user.businessName || user.name || "This organisation",
  })

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="data-protection-report.html"`,
    },
  })
}
