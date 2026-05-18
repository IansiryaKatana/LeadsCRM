export interface NoteField {
  label: string;
  value: string;
}

export interface ParsedLeadNote {
  type: "plain" | "structured";
  plain?: string;
  summary?: NoteField[];
  message?: string;
  details?: NoteField[];
}

const SUBMISSION_DETAILS_MARKER = "--- Submission Details ---";

const HIDDEN_DETAIL_KEYS = new Set([
  "raw payload json",
  "raw_payload_json",
  "form type raw",
  "lead type normalized",
  "inquiry type raw",
]);

function parseKeyValueLine(line: string): NoteField | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const colonIndex = trimmed.indexOf(":");
  if (colonIndex <= 0) return null;

  const label = trimmed.slice(0, colonIndex).trim();
  const value = trimmed.slice(colonIndex + 1).trim();
  if (!label) return null;

  return { label, value };
}

function isHiddenDetail(label: string): boolean {
  return HIDDEN_DETAIL_KEYS.has(label.trim().toLowerCase());
}

function isBrokenObjectValue(value: string): boolean {
  return value === "[object Object]" || value === "[object Array]";
}

export function formatNoteDisplayValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || isBrokenObjectValue(trimmed)) return "";

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function collectFields(lines: string[]): NoteField[] {
  const fields: NoteField[] = [];

  for (const line of lines) {
    const parsed = parseKeyValueLine(line);
    if (!parsed) continue;

    const displayValue = formatNoteDisplayValue(parsed.value);
    if (!displayValue) continue;

    fields.push({ label: parsed.label, value: displayValue });
  }

  return fields;
}

export function parseLeadNote(note: string): ParsedLeadNote {
  const trimmed = note.trim();
  if (!trimmed) {
    return { type: "plain", plain: "" };
  }

  const hasStructuredMarker =
    trimmed.includes("Form:") || trimmed.includes(SUBMISSION_DETAILS_MARKER);

  if (!hasStructuredMarker) {
    return { type: "plain", plain: trimmed };
  }

  const [headerPart = "", detailsPart = ""] = trimmed.split(SUBMISSION_DETAILS_MARKER);
  const headerLines = headerPart.trim().split("\n");
  const summary: NoteField[] = [];
  let message: string | undefined;

  for (const line of headerLines) {
    const parsed = parseKeyValueLine(line);
    if (!parsed) continue;

    if (parsed.label.toLowerCase() === "message") {
      const displayValue = formatNoteDisplayValue(parsed.value);
      if (displayValue) message = displayValue;
      continue;
    }

    const displayValue = formatNoteDisplayValue(parsed.value);
    if (!displayValue) continue;

    summary.push({ label: parsed.label, value: displayValue });
  }

  const details = collectFields(detailsPart.split("\n")).filter(
    (field) => !isHiddenDetail(field.label),
  );

  if (summary.length === 0 && !message && details.length === 0) {
    return { type: "plain", plain: trimmed };
  }

  return {
    type: "structured",
    summary: summary.length > 0 ? summary : undefined,
    message,
    details: details.length > 0 ? details : undefined,
  };
}
