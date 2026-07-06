/** Contact form submissions (general inquiries, not sales leads). */
export const INQUIRIES_SOURCE_SLUG = "web_contact";

/** Pay Urban Hub balance payments from the website. */
export const DEPOSITS_PAYMENTS_SOURCE_SLUG = "web_urban_hub_payment";

/** Legacy deposit form source. */
export const WEB_DEPOSIT_SOURCE_SLUG = "web_deposit";

/** Sources whose revenue comes from payment metadata, not room pricing. */
export const PAYMENT_LEAD_SOURCE_SLUGS = [
  DEPOSITS_PAYMENTS_SOURCE_SLUG,
  WEB_DEPOSIT_SOURCE_SLUG,
] as const;

export function isPaymentLeadSource(source: string): boolean {
  return (PAYMENT_LEAD_SOURCE_SLUGS as readonly string[]).includes(source);
}

/** Sources shown on dedicated routes — excluded from All Leads and its sidebar sub-items. */
export const EXCLUDED_FROM_ALL_LEADS_SOURCE_SLUGS = [
  INQUIRIES_SOURCE_SLUG,
  DEPOSITS_PAYMENTS_SOURCE_SLUG,
] as const;

export function isExcludedFromAllLeads(source: string): boolean {
  return (EXCLUDED_FROM_ALL_LEADS_SOURCE_SLUGS as readonly string[]).includes(source);
}
