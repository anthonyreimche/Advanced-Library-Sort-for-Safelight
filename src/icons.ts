// Shared inline SVG icons (stroke = currentColor), built via the app's React.
//
// NOTE: extensions are bundled separately and loaded at runtime, so the app's
// Tailwind build never scans this source — utility classes the core app doesn't
// already use won't exist in the CSS. So sizing/layout here uses inline styles
// (and CSS variables for colour), which always apply. Colour comes from the
// parent's `color` via currentColor.

import { h } from "./runtime";

/** Magnifier sized to `size` px. Colour is inherited (currentColor). */
export function searchIcon(size = 14) {
  return h(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      style: { display: "block", flexShrink: 0 },
    },
    h("circle", { cx: 11, cy: 11, r: 7 }),
    h("line", { x1: 21, y1: 21, x2: 16.65, y2: 16.65 }),
  );
}
