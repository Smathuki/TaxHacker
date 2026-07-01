/** Escape a literal string for safe inclusion in a RegExp. */
export function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Scan `text` with a global regex and emit a match per hit. When `group` is 0
 * the whole match is used; otherwise the regex MUST carry the `d` flag and the
 * given capture group's own offsets are used (so context anchors like
 * "ID no: <digits>" redact only the digits, not the anchor word).
 */
export function scan(text, re, label, group = 0, score = 1) {
    const out = [];
    for (const m of text.matchAll(re)) {
        if (group === 0) {
            if (typeof m.index !== "number")
                continue;
            const value = m[0];
            out.push({ start: m.index, end: m.index + value.length, label, value, score });
        }
        else {
            const span = m.indices?.[group];
            const value = m[group];
            if (!span || value == null)
                continue;
            out.push({ start: span[0], end: span[1], label, value, score });
        }
    }
    return out;
}
//# sourceMappingURL=util.js.map