// Tests for the Library sort comparators.
// Run with: node --experimental-strip-types src/sort.test.ts

import { SORTS } from "./sort.ts";
import type { CatalogPhoto, ExifData } from "./safelight";

function photo(id: string, exif: Partial<ExifData>): CatalogPhoto {
  return {
    id,
    filename: id,
    mimeType: "image/x-nikon-nef",
    rating: 0,
    colorLabel: "none",
    flag: "none",
    keywords: [],
    dateCreated: 0,
    dateImported: 0,
    exif: exif as ExifData,
  } as CatalogPhoto;
}

function find(idSuffix: string) {
  const def = SORTS.find((s) => s.id.endsWith(idSuffix));
  if (!def) throw new Error(`no sort ${idSuffix}`);
  return def;
}

// Ascending order of ids when sorted by `idSuffix`.
function order(idSuffix: string, photos: CatalogPhoto[]): string[] {
  return [...photos].sort(find(idSuffix).compare).map((p) => p.id);
}

let passed = 0;
let failed = 0;
function check(name: string, got: string[], expected: string[]) {
  const ok = got.length === expected.length && got.every((v, i) => v === expected[i]);
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} — got [${got}], expected [${expected}]`);
  }
}

console.log("sort comparators:");

// Camera: by make+model, blanks last.
const cams = [
  photo("sony", { cameraMake: "Sony", cameraModel: "A7 IV" }),
  photo("nikon", { cameraMake: "Nikon", cameraModel: "D5300" }),
  photo("none", {}),
  photo("canon", { cameraMake: "Canon", cameraModel: "R5" }),
];
check("camera ascending, blanks last", order("camera", cams), [
  "canon",
  "nikon",
  "sony",
  "none",
]);

// Lens: alphabetical, blanks last.
const lenses = [
  photo("tele", { lens: "70-300mm f/4.5-6.3" }),
  photo("none", {}),
  photo("wide", { lens: "24-70mm f/2.8" }),
];
check("lens ascending, blanks last", order("lens", lenses), ["wide", "tele", "none"]);

// Focal length: numeric, blanks last.
const focals = [
  photo("f300", { focalLength: 300 }),
  photo("f50", { focalLength: 50 }),
  photo("none", {}),
  photo("f135", { focalLength: 135 }),
];
check("focal numeric, blanks last", order("focal", focals), [
  "f50",
  "f135",
  "f300",
  "none",
]);

// ISO: numeric, blanks last.
const isos = [
  photo("hi", { iso: 6400 }),
  photo("lo", { iso: 100 }),
  photo("mid", { iso: 800 }),
];
check("iso numeric", order("iso", isos), ["lo", "mid", "hi"]);

// All four sorts are registered with distinct ids/labels.
check(
  "four sorts registered",
  SORTS.map((s) => s.label),
  ["Camera", "Lens", "Focal Length", "ISO"],
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
