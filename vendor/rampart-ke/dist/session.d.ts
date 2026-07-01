/**
 * Reversible placeholder table for the Kenyan layer.
 *
 * Mirrors the design of upstream Rampart's `SessionEntityTable`, but mints
 * Kenyan-friendly tokens (`[KRA_PIN_1]`, `[MPESA_CODE_1]`) keyed on the entity
 * class, which the fixed upstream `PiiLabel` set cannot express. The map lives
 * only on the client; only placeholdered text ever leaves the device.
 */
import type { KenyanLabel, KenyanMatch } from "./types.js";
export interface KenyanEntity {
    readonly label: KenyanLabel;
    readonly placeholder: string;
    readonly value: string;
}
export interface KenyanScrubResult {
    /** Text with Kenyan PII replaced by placeholders. */
    readonly text: string;
    /** Placeholders introduced or reused in this message. */
    readonly placeholders: readonly string[];
    /** Per-entity detail, for the demo's detection panel. */
    readonly entities: readonly KenyanEntity[];
}
export declare class KenyanEntityTable {
    private readonly counters;
    private readonly forward;
    private readonly reverse;
    /** Normalise a value so casing/whitespace noise doesn't mint duplicate tokens. */
    private normalise;
    /** Get or mint the stable placeholder for a label+value. Idempotent. */
    placeholderFor(label: KenyanLabel, value: string): string;
    /**
     * Replace each (disjoint) match with its placeholder. Splices right-to-left
     * so an earlier match's offsets stay valid as later text is rewritten.
     */
    mask(raw: string, matches: readonly KenyanMatch[]): KenyanScrubResult;
    /** Restore real Kenyan values in a reply. Unknown tokens are left intact. */
    reveal(text: string): string;
    /** True if `token` is a Kenyan placeholder this table can resolve. */
    knows(token: string): boolean;
}
//# sourceMappingURL=session.d.ts.map