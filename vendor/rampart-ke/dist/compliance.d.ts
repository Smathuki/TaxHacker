/**
 * Compliance audit + reporting.
 *
 * Kenya's Data Protection Act (2019) requires data handlers to demonstrate how
 * they protect personal data. This module produces that evidence — counts of how
 * much PII was redacted on-device, by category and by day — and renders an
 * ODPC-style compliance report.
 *
 * Privacy by design (and the selling point): the recorder stores ONLY
 * `{ label, day, count }`. No values, no text, no hashes of values. The audit
 * log is itself free of personal data, so retaining it creates no new liability.
 */
/** The minimal shape consumed from a `protect()` result. */
export interface RedactionOutcome {
    /** Placeholder tokens introduced this turn, e.g. `["[KRA_PIN_1]", "[EMAIL_1]"]`. */
    readonly placeholders: readonly string[];
}
/** Extract the entity label from a placeholder token, or `null` if it isn't one. */
export declare function parsePlaceholderLabel(token: string): string | null;
export interface ComplianceSummary {
    /** Earliest day with a redaction (YYYY-MM-DD), or null if none recorded. */
    readonly from: string | null;
    /** Latest day with a redaction (YYYY-MM-DD), or null if none recorded. */
    readonly to: string | null;
    /** Number of messages/turns recorded. */
    readonly sessions: number;
    /** Total PII instances redacted. */
    readonly totalRedactions: number;
    /** Instances per label, highest first. */
    readonly byLabel: Record<string, number>;
    /** Instances per day (YYYY-MM-DD), earliest first. */
    readonly byDay: Record<string, number>;
}
/** Serialised recorder state — still contains no personal data. */
export interface RecorderState {
    readonly sessions: number;
    readonly byLabel: Record<string, number>;
    readonly byDay: Record<string, number>;
}
/**
 * Accumulates PII-free redaction counts. Feed each `protect()` result to
 * {@link record}; read {@link summary} or hand it to {@link generateComplianceReport}.
 */
export declare class ComplianceRecorder {
    private sessions;
    private readonly byLabel;
    private readonly byDay;
    /** Record one protected message. Only labels + the day are stored. */
    record(outcome: RedactionOutcome, at?: Date): void;
    summary(): ComplianceSummary;
    reset(): void;
    toJSON(): RecorderState;
    static fromJSON(state: RecorderState): ComplianceRecorder;
}
export interface ComplianceReportOptions {
    readonly organisation?: string;
    readonly periodLabel?: string;
    readonly generatedAt?: Date;
    readonly packageVersion?: string;
}
export interface ComplianceReport {
    readonly markdown: string;
    /** A standalone HTML document, suitable for download / print-to-PDF. */
    readonly html: string;
}
/** Render an ODPC-style compliance report as both Markdown and standalone HTML. */
export declare function generateComplianceReport(summary: ComplianceSummary, options?: ComplianceReportOptions): ComplianceReport;
//# sourceMappingURL=compliance.d.ts.map