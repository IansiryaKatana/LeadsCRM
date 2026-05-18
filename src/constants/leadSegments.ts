/** Contact form submissions (general inquiries, not sales leads). */
export const INQUIRIES_SOURCE_SLUG = "web_contact";

/** Pay Urban Hub balance payments from the website. */
export const DEPOSITS_PAYMENTS_SOURCE_SLUG = "web_urban_hub_payment";

/** Sources shown on dedicated routes — excluded from All Leads and its sidebar sub-items. */
export const EXCLUDED_FROM_ALL_LEADS_SOURCE_SLUGS = [
  INQUIRIES_SOURCE_SLUG,
  DEPOSITS_PAYMENTS_SOURCE_SLUG,
] as const;

export function isExcludedFromAllLeads(source: string): boolean {
  return (EXCLUDED_FROM_ALL_LEADS_SOURCE_SLUGS as readonly string[]).includes(source);
}
