import { SegmentLeadsPage } from "@/pages/SegmentLeadsPage";
import { INQUIRIES_SOURCE_SLUG } from "@/constants/leadSegments";

export default function Inquiries() {
  return (
    <SegmentLeadsPage
      sourceSlug={INQUIRIES_SOURCE_SLUG}
      title="Inquiries"
      subtitle="Website contact form submissions — general inquiries and support requests"
      viewMode="web_contact"
      showCreateLead={false}
    />
  );
}
