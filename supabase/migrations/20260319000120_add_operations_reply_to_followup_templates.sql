-- Ensure follow-up templates clearly direct recipients to reply to operations@urbanhub.uk
-- Applies to existing live rows and avoids duplicate appends.

UPDATE public.email_templates
SET
  body_html = CASE
    WHEN position('operations@urbanhub.uk' in COALESCE(body_html, '')) > 0 THEN body_html
    ELSE COALESCE(body_html, '') ||
      '<div style="margin-top:20px;padding:14px;border:2px solid #1d4ed8;border-radius:8px;background:#eff6ff;">' ||
      '<p style="margin:0;font-size:15px;font-weight:700;color:#1e3a8a;">For a faster response, please reply directly to <a href="mailto:operations@urbanhub.uk" style="color:#1d4ed8;">operations@urbanhub.uk</a>.</p>' ||
      '</div>'
  END,
  body_text = CASE
    WHEN position('operations@urbanhub.uk' in COALESCE(body_text, '')) > 0 THEN body_text
    ELSE COALESCE(body_text, '') || E'\n\nFor a faster response, please reply directly to operations@urbanhub.uk.'
  END
WHERE category IN ('followup_1', 'followup_2', 'followup_3')
   OR name IN ('Follow-up #1', 'Follow-up #2', 'Follow-up #3');
