import type { KenyanLabel, KenyanMatch } from "../types.js";
/** Escape a literal string for safe inclusion in a RegExp. */
export declare function escapeRegExp(s: string): string;
/**
 * Scan `text` with a global regex and emit a match per hit. When `group` is 0
 * the whole match is used; otherwise the regex MUST carry the `d` flag and the
 * given capture group's own offsets are used (so context anchors like
 * "ID no: <digits>" redact only the digits, not the anchor word).
 */
export declare function scan(text: string, re: RegExp, label: KenyanLabel, group?: number, score?: number): KenyanMatch[];
//# sourceMappingURL=util.d.ts.map