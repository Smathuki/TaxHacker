/**
 * Overlap resolution for the Kenyan deterministic layer.
 *
 * Each recognizer scans the raw text independently and may report matches that
 * overlap another recognizer's (e.g. a phone number inside an address line).
 * {@link detectKenyan} reduces them to a disjoint, start-sorted set so the
 * session table can splice placeholders without corrupting offsets.
 */
import type { KenyanMatch, Recognizer } from "./types.js";
/**
 * Run every recognizer over `text` and collapse the results into a
 * non-overlapping set. Conflicts are resolved by: earliest start first, then
 * longer span, then higher recognizer priority. Biased to keep a redaction
 * rather than drop one (recall over precision), per the threat model.
 */
export declare function detectKenyan(text: string, recognizers: readonly Recognizer[]): KenyanMatch[];
//# sourceMappingURL=premask.d.ts.map