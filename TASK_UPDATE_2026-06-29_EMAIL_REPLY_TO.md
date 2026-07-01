# Task Update — Student Email Reply-To & CC

**Date:** 29 June 2026  
**Status:** Implemented in code — pending Supabase deploy & migration apply  
**Reported by:** Jamie (Urban Hub)  
**Issue:** Students clicking Reply on CRM and website emails were replying to `noreply@send.portal.urbanhub.uk`, so responses were lost.

---

## Problem

- Website viewing confirmations and CRM follow-ups send **From** `noreply@send.portal.urbanhub.uk` (required for Resend).
- No **Reply-To** header was set, so email clients used the noreply address when students hit Reply.
- Previous fix only added body text (“please reply to operations@urbanhub.uk”) — does not change Reply button behaviour.
- Team had to duplicate-send from operations@ to ensure replies were received.

---

## Solution Implemented

Set a proper **Reply-To** header on all student-facing outbound emails, plus configurable **CC** for internal visibility.

| Setting | Default | Purpose |
|--------|---------|---------|
| **Reply-To** | `operations@urbanhub.uk` | Where Reply goes in Gmail/Outlook etc. |
| **CC** | `Leads@urbanhub.uk` | Internal copy on every student email (add more in settings) |
| **From** | `Urban Hub <noreply@send.portal.urbanhub.uk>` | Unchanged — Resend verified domain |

**Scope:** All student emails (`type: "email"` in `send-notification`) — welcome, follow-ups, conversion, website auto-responses (viewing, callback, inquiry, deposits, etc.).  
**Not changed:** Internal staff notifications (new lead, assigned, status change, event reminders).

---

## Files Changed

### Edge function
- `supabase/functions/send-notification/index.ts`
  - Reads `email_reply_to_address` and `email_cc_addresses` from `system_settings`
  - Adds `reply_to` and `cc` to Resend `emails.send()` for student-facing sends
  - Helpers: `normalizeEmailAddress()`, `normalizeEmailList()`

### CRM settings (frontend)
- `src/hooks/useSystemSettings.ts` — new settings keys and defaults
- `src/components/settings/SystemSettingsTab.tsx` — **Student Email Settings** card:
  - From address
  - Reply-To address
  - CC addresses (add/remove list)
  - Single **Save Email Settings** button
  - Fixed missing `toast` import

### Database migrations
- `supabase/migrations/20260629000001_add_email_reply_to_and_cc_settings.sql`
  - Seeds `email_reply_to_address` and `email_cc_addresses`
- `supabase/migrations/20260629000002_strip_markdown_fences_from_email_templates.sql`
  - Removes accidental `` ```html `` markdown fences from template bodies

---

## Deploy Required (not done from dev environment)

CLI deploy returned 403 (no Supabase deploy privileges from agent environment). Ian / dev with access must run:

```powershell
cd "e:\work videos projects\UrbanHub Leads CRM"
supabase login
supabase link --project-ref btbsslznsexidjnzizre
supabase db push
supabase functions deploy send-notification --project-ref btbsslznsexidjnzizre
```

Or apply the two migration SQL files via **Supabase Dashboard → SQL Editor**, then deploy `send-notification` via **Edge Functions**.

---

## Verification Checklist

After deploy:

1. **Settings → Student Email Settings** — confirm Reply-To `operations@urbanhub.uk`, CC includes `Leads@urbanhub.uk`, save.
2. Send **viewing confirmation** (website form or CRM `viewing_confirmation` template).
3. Send **Follow-up #1** from CRM Email tab.
4. Open each email on mobile/desktop → **Reply** → **To** must be `operations@urbanhub.uk` (not noreply).
5. Confirm `Leads@urbanhub.uk` receives CC copy.
6. Confirm email body no longer shows `` ```html `` at the top (template cleanup migration).

---

## Outcome for Operations

- Students can hit Reply normally; mail goes to **operations@urbanhub.uk**.
- **Leads@urbanhub.uk** (and any added CC addresses) get a copy of every student email.
- No need to duplicate-send from operations@ after CRM sends.
- Reply-To and CC are editable in CRM without code changes.

---

## Related Prior Work (insufficient on its own)

- `supabase/migrations/20260319000120_add_operations_reply_to_followup_templates.sql` — body-only notice on follow-up templates #1–#3 only.
