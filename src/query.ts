// Turn a free-text search query into a predicate over CatalogPhoto. Pure and
// synchronous — runs client-side over the already-loaded photos array, so no
// index or backend is needed for typical project sizes.
//
// Grammar (whitespace-separated tokens, ANDed together — Lightroom's filter-bar
// behaviour):
//   bare token        → substring match across filename, keywords, mimeType,
//                       colour label, camera, lens, "<focal>mm", "iso<n>", date
//   field:value       → scoped match (see FIELD_ALIASES below)
//     text fields (filename/keyword/camera/lens/type/label/date) → substring
//     numeric fields (iso/focal) → comparator: >n >=n <n <=n =n, plain n, or n-m
//   unknown field     → the whole token falls back to a bare substring match
//
// Examples:
//   heron 300mm                  → keyword/blob "heron" AND blob "300mm"
//   lens:70-300 iso:>3200        → lens contains "70-300" AND iso > 3200
//   camera:D5300 date:2025-08    → camera contains "d5300" AND date ~ 2025-08
//   filename:DSC_04              → filename contains "dsc_04"

import type { CatalogPhoto } from "./safelight";

export type Matcher = (photo: CatalogPhoto) => boolean;

/** Build a matcher from a raw query. Empty/whitespace matches everything. */
export function buildMatcher(raw: string): Matcher {
  const tokens = tokenize(raw);
  if (tokens.length === 0) return () => true;
  const clauses = tokens.map(compileToken);
  return (photo) => clauses.every((c) => c(photo));
}

/** True when a query actually constrains anything (drives the active styling). */
export function isQueryActive(raw: string): boolean {
  return tokenize(raw).length > 0;
}

function tokenize(raw: string): string[] {
  return raw.trim().split(/\s+/).filter(Boolean);
}

function compileToken(token: string): Matcher {
  const colon = token.indexOf(":");
  if (colon > 0) {
    const field = token.slice(0, colon).toLowerCase();
    const value = token.slice(colon + 1);
    if (value) {
      const clause = compileField(field, value);
      if (clause) return clause;
      // Unknown field → search its value as free text (forgiving fallback).
      return freeText(value);
    }
    // Empty value (e.g. "foo:") → treat the whole token as free text.
  }
  return freeText(token);
}

function compileField(field: string, value: string): Matcher | null {
  switch (field) {
    case "filename":
    case "file":
    case "name":
      return (p) => incl(p.filename, value);
    case "keyword":
    case "keywords":
    case "kw":
      return (p) => p.keywords.some((k) => incl(k, value));
    case "camera":
    case "make":
    case "model":
      return (p) =>
        incl(p.exif.cameraMake, value) || incl(p.exif.cameraModel, value);
    case "lens":
      return (p) => incl(p.exif.lens, value);
    case "type":
    case "mime":
    case "ext":
      return (p) => incl(p.mimeType, value);
    case "label":
    case "color":
      return (p) => p.colorLabel === value.toLowerCase();
    case "iso":
      return numClause(value, (p) => p.exif.iso);
    case "focal":
    case "focallength":
    case "mm":
      return numClause(value, (p) => p.exif.focalLength);
    case "date":
    case "day":
      return (p) => dateStr(p).includes(value.toLowerCase());
    default:
      return null;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function incl(hay: string | undefined, needle: string): boolean {
  return !!hay && hay.toLowerCase().includes(needle.toLowerCase());
}

function freeText(token: string): Matcher {
  const t = token.toLowerCase();
  return (p) => blob(p).includes(t);
}

/** Searchable text for bare tokens: filename + keywords + a few EXIF facets,
 *  encoded so "300mm", "iso6400", "6400" and "2024-06" all hit. */
function blob(p: CatalogPhoto): string {
  const e = p.exif;
  return [
    p.filename,
    p.keywords.join(" "),
    p.mimeType,
    p.colorLabel === "none" ? "" : p.colorLabel,
    e.cameraMake,
    e.cameraModel,
    e.lens,
    e.focalLength != null ? `${e.focalLength}mm` : "",
    e.iso != null ? `iso${e.iso} ${e.iso}` : "",
    dateStr(p),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function numClause(
  value: string,
  get: (p: CatalogPhoto) => number | undefined,
): Matcher {
  const cmp = parseNum(value);
  return (p) => {
    const n = get(p);
    return n != null && cmp(n);
  };
}

/** Parse ">3200", ">=3200", "<800", "=300", "300", "300mm", or "200-300". An
 *  unparseable value never matches numerically. */
function parseNum(value: string): (n: number) => boolean {
  const range = value.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    return (n) => n >= lo && n <= hi;
  }
  const m = value.match(/^(>=|<=|>|<|=)?\s*(\d+(?:\.\d+)?)\s*[a-z]*$/i);
  if (!m) return () => false;
  const target = Number(m[2]);
  switch (m[1]) {
    case ">":
      return (n) => n > target;
    case ">=":
      return (n) => n >= target;
    case "<":
      return (n) => n < target;
    case "<=":
      return (n) => n <= target;
    default:
      return (n) => n === target;
  }
}

/** Local YYYY-MM-DD for the capture date, or "" if unknown. */
function dateStr(p: CatalogPhoto): string {
  const t = p.dateCreated;
  if (!t) return "";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
