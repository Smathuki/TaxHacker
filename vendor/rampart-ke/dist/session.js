/**
 * Reversible placeholder table for the Kenyan layer.
 *
 * Mirrors the design of upstream Rampart's `SessionEntityTable`, but mints
 * Kenyan-friendly tokens (`[KRA_PIN_1]`, `[MPESA_CODE_1]`) keyed on the entity
 * class, which the fixed upstream `PiiLabel` set cannot express. The map lives
 * only on the client; only placeholdered text ever leaves the device.
 */
/** Matches any `[LABEL_n]` token; used to find Kenyan placeholders on reveal. */
const PLACEHOLDER_PATTERN = /\[[A-Z][A-Z0-9_]*_\d+\]/g;
export class KenyanEntityTable {
    counters = new Map();
    forward = new Map(); // `${label}|${norm}` -> token
    reverse = new Map(); // token -> raw value
    /** Normalise a value so casing/whitespace noise doesn't mint duplicate tokens. */
    normalise(value) {
        return value.trim().replace(/\s+/g, " ").toUpperCase();
    }
    /** Get or mint the stable placeholder for a label+value. Idempotent. */
    placeholderFor(label, value) {
        const key = `${label}|${this.normalise(value)}`;
        const existing = this.forward.get(key);
        if (existing)
            return existing;
        const next = (this.counters.get(label) ?? 0) + 1;
        this.counters.set(label, next);
        const token = `[${label}_${next}]`;
        this.forward.set(key, token);
        this.reverse.set(token, value);
        return token;
    }
    /**
     * Replace each (disjoint) match with its placeholder. Splices right-to-left
     * so an earlier match's offsets stay valid as later text is rewritten.
     */
    mask(raw, matches) {
        const ordered = [...matches].sort((a, b) => b.start - a.start);
        let text = raw;
        const placeholders = [];
        const entities = [];
        for (const m of ordered) {
            const placeholder = this.placeholderFor(m.label, m.value);
            text = text.slice(0, m.start) + placeholder + text.slice(m.end);
            placeholders.push(placeholder);
            entities.push({ label: m.label, placeholder, value: m.value });
        }
        placeholders.reverse();
        entities.reverse();
        return { text, placeholders, entities };
    }
    /** Restore real Kenyan values in a reply. Unknown tokens are left intact. */
    reveal(text) {
        return text.replace(PLACEHOLDER_PATTERN, (token) => this.reverse.get(token) ?? token);
    }
    /** True if `token` is a Kenyan placeholder this table can resolve. */
    knows(token) {
        return this.reverse.has(token);
    }
}
//# sourceMappingURL=session.js.map