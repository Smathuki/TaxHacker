/**
 * Boundary-repairing NER detector.
 *
 * The Rampart model is a WordPiece token classifier. Tokenization can make it
 * under-cover a word — e.g. it labels "OCHIEN" of "OCHIENG" and leaves a
 * trailing "G" exposed, so "JOHN OCHIENG" redacts to "[GIVEN_NAME_1] [SURNAME_1] G".
 *
 * We plug into ChatGuard's `ner` seam: run the real model, then snap every span
 * out to whole-word boundaries before it reaches the merge/redact step. The fix
 * is recall-biased — we only ever grow a redaction, never shrink one.
 */
import { type NerDetector, type NerOptions, type Span } from "@nationaldesignstudio/rampart";
/**
 * For each span, if it begins or ends in the middle of a contiguous word,
 * extend it to cover the whole word so no fragment is left behind.
 */
export declare function repairSpanBoundaries(text: string, spans: readonly Span[]): Span[];
/** Wrap any NER detector so its spans are repaired to whole-word boundaries. */
export declare function withBoundaryRepair(detect: NerDetector): NerDetector;
/**
 * Drop model spans whose text is one of the 47 counties. The model sometimes
 * mislabels a county as a GIVEN_NAME (seen with "Nairobi" in Swahili context),
 * which would redact coarse geography we deliberately keep for analytics. This
 * enforces the keep-county policy regardless of the label the model assigned.
 * A trailing " County" is tolerated ("Nairobi County" → kept).
 */
export declare function keepCounties(spans: readonly Span[]): Span[];
/**
 * Build the default boundary-repairing detector: the real Rampart ONNX
 * classifier, wrapped so token-edge fragments are swallowed before redaction
 * and counties are never redacted.
 */
export declare function createRepairingNer(options?: NerOptions): Promise<NerDetector>;
//# sourceMappingURL=ner.d.ts.map