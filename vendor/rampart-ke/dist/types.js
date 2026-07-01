/**
 * Shared vocabulary for the Kenyan deterministic layer.
 *
 * Rampart's ML model emits a fixed 20-label `PiiLabel` set (names, addresses,
 * SSN, card, ...). It cannot represent Kenyan structured identifiers like a KRA
 * PIN or an M-Pesa code without retraining, and several of ours (M-Pesa codes,
 * company names) have no upstream label at all. So rampart-ke detects these in
 * its own deterministic pass and mints its own friendly placeholders
 * (`[KRA_PIN_1]`, `[MPESA_CODE_1]`, ...) *before* handing residual text to the
 * upstream guard, which still catches names/addresses with the model.
 */
export {};
//# sourceMappingURL=types.js.map