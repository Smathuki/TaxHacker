/**
 * Common Kenyan estates / neighbourhoods / sub-localities. These are
 * fine-grained and locating, so they are REDACTED to [LOCATION_KE_n].
 *
 * Multi-word entries (e.g. "South B") are matched as whole phrases. The base
 * Rampart model is trained on Western address formats and will not reliably
 * recognise these, so the gazetteer drives detection directly. Extend freely.
 */
export declare const ESTATES: readonly string[];
//# sourceMappingURL=estates.d.ts.map