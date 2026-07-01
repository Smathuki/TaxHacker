/**
 * rampart-ke — Kenya-localized, on-device PII redaction.
 *
 * A thin wrapper around `@nationaldesignstudio/rampart`. Two layers run, both
 * entirely on the device, before any text is sent to a server or LLM:
 *
 *   1. Kenyan deterministic recognizers (this package) detect structured local
 *      identifiers — KRA PIN, M-Pesa codes, phone numbers, National ID / Maisha
 *      Namba, SHA/SHIF, NSSF, bank/passport, company names, estates/roads — and
 *      replace them with friendly placeholders like [KRA_PIN_1], [MPESA_CODE_1].
 *   2. The upstream Rampart guard then catches names and addresses with its
 *      quantized ONNX model, keeping coarse geography (towns / counties).
 *
 * Real values never leave the device; only placeholdered text does.
 */
import { type KenyanEntity } from "./session.js";
import type { KenyanGuardOptions } from "./types.js";
/** Result of protecting one message. */
export interface KenyanProtectResult {
    /** Text with PII replaced by placeholders. Safe to send/log. */
    readonly text: string;
    /** All placeholders introduced this turn (Kenyan layer + upstream). */
    readonly placeholders: readonly string[];
    /** The Kenyan-layer detections, for audit / the demo's detection panel. */
    readonly entities: readonly KenyanEntity[];
}
/**
 * A per-conversation Kenyan PII guard. Wraps an upstream `ChatGuard` and a
 * Kenyan entity table; placeholder identity is stable across turns.
 */
export declare class KenyanGuard {
    private readonly guard;
    private readonly table;
    private readonly recognizers;
    private constructor();
    static create(options?: KenyanGuardOptions): Promise<KenyanGuard>;
    /**
     * Redact Kenyan structured IDs deterministically, then hand the residual text
     * to the upstream guard for names/addresses. Run on the user's text BEFORE it
     * reaches any AI SDK or server.
     */
    protect(text: string): Promise<KenyanProtectResult>;
    /** Restore real values (Kenyan layer + upstream) in a complete reply. */
    reveal(reply: string): string;
}
/** Build a conversation guard. See {@link KenyanGuardOptions}. */
export declare function createKenyanGuard(options?: KenyanGuardOptions): Promise<KenyanGuard>;
/**
 * One-shot convenience: protect a single string using a lazily-created shared
 * guard. Handy for demos and scripts; for a chat session prefer
 * {@link createKenyanGuard} so placeholders stay stable across turns.
 */
export declare function protectKE(text: string, options?: KenyanGuardOptions): Promise<KenyanProtectResult>;
export { DEFAULT_RECOGNIZERS } from "./recognizers/index.js";
export { detectKenyan } from "./premask.js";
export { repairSpanBoundaries, withBoundaryRepair, keepCounties, createRepairingNer } from "./ner.js";
export { KenyanEntityTable } from "./session.js";
export { KE_KEEP_LABELS } from "./policy.js";
export { LABEL_DESCRIPTIONS } from "./labels.js";
export { ComplianceRecorder, generateComplianceReport, parsePlaceholderLabel } from "./compliance.js";
export type { KenyanEntity, KenyanScrubResult } from "./session.js";
export type { KenyanGuardOptions, KenyanLabel, KenyanMatch, Recognizer } from "./types.js";
export type { ComplianceSummary, ComplianceReport, ComplianceReportOptions, RecorderState, RedactionOutcome, } from "./compliance.js";
//# sourceMappingURL=index.d.ts.map