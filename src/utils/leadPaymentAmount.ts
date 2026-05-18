function parseMoneyAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[£$,]/g, "").trim();
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Payment amount in major currency units (e.g. GBP pounds) from lead metadata. */
export function getLeadPaymentAmountPounds(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const meta = metadata as Record<string, unknown>;

  const pence = Number(meta.amount_pence);
  if (Number.isFinite(pence) && pence > 0) return pence / 100;

  const gbp = parseMoneyAmount(meta.amount_gbp);
  if (gbp !== null && gbp > 0) return gbp;

  const deposit = parseMoneyAmount(meta.deposit_amount);
  if (deposit !== null && deposit > 0) return deposit;

  return null;
}

/** Stripe / gateway payment identifier from lead metadata. */
export function getLeadPaymentId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const meta = metadata as Record<string, unknown>;
  const id = meta.payment_intent_id ?? meta.payment_id;
  if (id === null || id === undefined) return null;
  const text = String(id).trim();
  return text.length > 0 ? text : null;
}
