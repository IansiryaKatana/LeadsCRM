-- Remove accidental markdown code fences from email template bodies.

UPDATE public.email_templates
SET body_html = trim(both E'\n\r\t ' FROM
  regexp_replace(
    regexp_replace(COALESCE(body_html, ''), '^\s*```html\s*', '', 'i'),
    '\s*```\s*$', '', 'i'
  )
)
WHERE COALESCE(body_html, '') ~ '```';

UPDATE public.email_templates
SET body_text = trim(both E'\n\r\t ' FROM
  regexp_replace(
    regexp_replace(COALESCE(body_text, ''), '^\s*```(?:html)?\s*', '', 'i'),
    '\s*```\s*$', '', 'i'
  )
)
WHERE COALESCE(body_text, '') ~ '```';
