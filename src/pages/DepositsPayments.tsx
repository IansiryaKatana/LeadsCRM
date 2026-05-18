import { SegmentLeadsPage } from "@/pages/SegmentLeadsPage";
import { DEPOSITS_PAYMENTS_SOURCE_SLUG } from "@/constants/leadSegments";

export default function DepositsPayments() {
  return (
    <SegmentLeadsPage
      sourceSlug={DEPOSITS_PAYMENTS_SOURCE_SLUG}
      title="Deposits & Payments"
      subtitle="Pay Urban Hub balance payments received via the website"
      viewMode="deposits_payments"
      showCreateLead={false}
    />
  );
}
