// Tests for the search query parser.
// Run with: node --experimental-strip-types src/query.test.ts

import { buildMatcher, isQueryActive } from "./query.ts";
import type { CatalogPhoto, ExifData } from "./safelight";

// Build a CatalogPhoto with sensible defaults; override what a case cares about.
function photo(over: {
  filename?: string;
  keywords?: string[];
  mimeType?: string;
  colorLabel?: CatalogPhoto["colorLabel"];
  dateCreated?: number;
  exif?: Partial<ExifData>;
}): CatalogPhoto {
  return {
    id: over.filename ?? "p",
    filename: over.filename ?? "DSC_0001.NEF",
    mimeType: over.mimeType ?? "image/x-nikon-nef",
    rating: 0,
    colorLabel: over.colorLabel ?? "none",
    flag: "none",
    keywords: over.keywords ?? [],
    dateCreated: over.dateCreated ?? 0,
    dateImported: 0,
    exif: (over.exif ?? {}) as ExifData,
  } as CatalogPhoto;
}

let passed = 0;
let failed = 0;

function check(name: string, query: string, p: CatalogPhoto, expected: boolean) {
  const got = buildMatcher(query)(p);
  if (got === expected) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} — query "${query}" → ${got}, expected ${expected}`);
  }
}

// ── filename ──
const heron = photo({
  filename: "DSC_0412.NEF",
  keywords: ["heron", "bird", "wetland"],
  exif: { cameraModel: "NIKON D5300", lens: "70-300mm f/4.5-6.3", focalLength: 300, iso: 6400 },
  dateCreated: Date.UTC(2024, 5, 15, 12, 0, 0), // 2024-06-15
});
const owl = photo({
  filename: "DSC_0999.JPG",
  mimeType: "image/jpeg",
  keywords: ["owl", "bird"],
  colorLabel: "red",
  exif: { cameraModel: "NIKON Z6", lens: "24-70mm f/2.8", focalLength: 50, iso: 800 },
  dateCreated: Date.UTC(2025, 7, 2, 9, 0, 0), // 2025-08-02
});

console.log("query parser:");

// Tier 1 — filename / keyword / mime / label
check("filename partial", "dsc_04", heron, true);
check("filename partial miss", "dsc_04", owl, false);
check("filename:field", "filename:0412", heron, true);
check("keyword bare", "heron", heron, true);
check("keyword bare miss", "heron", owl, false);
check("keyword:field", "keyword:owl", owl, true);
check("mime type:field", "type:jpeg", owl, true);
check("mime type:field miss", "type:jpeg", heron, false);
check("label:field", "label:red", owl, true);
check("label:field miss", "label:red", heron, false);

// Tier 2 — EXIF
check("camera bare", "d5300", heron, true);
check("camera:field", "camera:nikon", owl, true);
check("lens:range-substring", "lens:70-300", heron, true);
check("lens:range-substring miss", "lens:70-300", owl, false);
check("iso:>3200", "iso:>3200", heron, true);
check("iso:>3200 miss", "iso:>3200", owl, false);
check("iso:<=800", "iso:<=800", owl, true);
check("focal:>=200", "focal:>=200", heron, true);
check("focal bare 300mm", "300mm", heron, true);
check("focal bare 300mm miss", "300mm", owl, false);
check("date:month", "date:2024-06", heron, true);
check("date:month miss", "date:2024-06", owl, false);
check("date bare year", "2025", owl, true);

// Combined (AND) + fallback
check("two-token AND", "heron 300mm", heron, true);
check("two-token AND miss", "owl 300mm", owl, false);
check("unknown field falls back to text", "foo:heron", heron, true);
check("empty matches all", "   ", owl, true);

// isQueryActive
if (isQueryActive("") || isQueryActive("   ")) {
  failed++;
  console.log("  ✗ isQueryActive should be false for blank");
} else {
  passed++;
  console.log("  ✓ isQueryActive false for blank");
}
if (isQueryActive("heron")) {
  passed++;
  console.log("  ✓ isQueryActive true for text");
} else {
  failed++;
  console.log("  ✗ isQueryActive should be true for text");
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
