// Library sort orders contributed to the core sort dropdown, Lightroom-style:
// by camera, lens, focal length, and ISO. Each comparator is ascending; the
// toolbar's direction toggle flips it. Photos missing the field sort last
// (ascending), matching how Lightroom groups blanks at the end.

import type { CatalogPhoto } from "./safelight";

export type Compare = (a: CatalogPhoto, b: CatalogPhoto) => number;

export interface SortDef {
  id: string;
  label: string;
  compare: Compare;
}

const PREFIX = "com.safelight.advanced-library-sort";

function text(get: (p: CatalogPhoto) => string | undefined): Compare {
  return (a, b) => {
    const av = (get(a) ?? "").trim().toLowerCase();
    const bv = (get(b) ?? "").trim().toLowerCase();
    if (!av && !bv) return 0;
    if (!av) return 1; // blanks last
    if (!bv) return -1;
    return av.localeCompare(bv);
  };
}

function num(get: (p: CatalogPhoto) => number | undefined): Compare {
  return (a, b) => {
    const av = get(a);
    const bv = get(b);
    const am = av == null;
    const bm = bv == null;
    if (am && bm) return 0;
    if (am) return 1; // blanks last
    if (bm) return -1;
    return av - bv;
  };
}

// Camera = make + model (e.g. "NIKON CORPORATION NIKON D5300"), trimmed.
function cameraName(p: CatalogPhoto): string {
  return `${p.exif.cameraMake ?? ""} ${p.exif.cameraModel ?? ""}`.trim();
}

export const SORTS: SortDef[] = [
  { id: `${PREFIX}.camera`, label: "Camera", compare: text(cameraName) },
  { id: `${PREFIX}.lens`, label: "Lens", compare: text((p) => p.exif.lens) },
  { id: `${PREFIX}.focal`, label: "Focal Length", compare: num((p) => p.exif.focalLength) },
  { id: `${PREFIX}.iso`, label: "ISO", compare: num((p) => p.exif.iso) },
];
