import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getComplianceSummary } from "@/models/compliance"
import { getSettings } from "@/models/settings"
import { Download, Info, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { LABEL_DESCRIPTIONS } from "rampart-ke"
import { manifest } from "./manifest"

export default async function PrivacyComplianceApp() {
  const user = await getCurrentUser()
  const summary = await getComplianceSummary(user.id)
  const settings = await getSettings(user.id)
  const privacyEnabled = settings.privacy_pipeline_enabled === "true"

  const labelRows = Object.entries(summary.byLabel).sort((a, b) => b[1] - a[1])
  const describe = (label: string) =>
    (LABEL_DESCRIPTIONS as Record<string, string>)[label] || label.replace(/_/g, " ").toLowerCase()

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.icon} {manifest.name}
          </span>
        </h2>
        {summary.totalRedactions > 0 && (
          <Button asChild variant="outline">
            <Link href="/apps/privacy-compliance/report" target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4" /> Download ODPC report
            </Link>
          </Button>
        )}
      </header>

      <Alert className="mb-6">
        <Info className="h-4 w-4 mt-2" />
        <div className="pt-2">
          <AlertTitle>This audit contains no personal data</AlertTitle>
          <AlertDescription>
            The on-device privacy pipeline records only how many PII instances were redacted, by category and day —
            never any value, text, or hash. It is safe to retain and to show the Office of the Data Protection
            Commissioner (ODPC) as evidence of your Data Protection Act 2019 posture.
          </AlertDescription>
        </div>
      </Alert>

      {!privacyEnabled && (
        <Alert className="mb-6">
          <ShieldCheck className="h-4 w-4 mt-2" />
          <div className="pt-2">
            <AlertTitle>The on-device privacy pipeline is currently off</AlertTitle>
            <AlertDescription>
              Turn it on in{" "}
              <Link href="/settings/llm" className="underline">
                Settings → AI
              </Link>{" "}
              to OCR and redact receipts on-device before anything is sent to the AI.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {summary.totalRedactions === 0 ? (
        <p className="text-muted-foreground">
          No on-device redactions recorded yet. Once the privacy pipeline is enabled and you scan receipts, redaction
          counts will appear here.
        </p>
      ) : (
        <>
          <div className="flex flex-row flex-wrap gap-4 mb-6">
            <Card className="p-4 flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">PII instances redacted</span>
              <span className="text-2xl font-bold">{summary.totalRedactions}</span>
            </Card>
            <Card className="p-4 flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Documents processed</span>
              <span className="text-2xl font-bold">{summary.sessions}</span>
            </Card>
            <Card className="p-4 flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Period</span>
              <span className="text-lg font-semibold">
                {summary.from || "—"} → {summary.to || "—"}
              </span>
            </Card>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>What it catches</TableHead>
                  <TableHead className="text-right">Redacted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labelRows.map(([label, count]) => (
                  <TableRow key={label}>
                    <TableCell className="font-medium whitespace-nowrap">{label}</TableCell>
                    <TableCell className="text-muted-foreground">{describe(label)}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
