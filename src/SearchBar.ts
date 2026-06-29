// The Library search bar. Mounted into the "library-subbar" slot, it renders
// its own full-width bar directly below the toolbar — or nothing when hidden.
// Toggled with Ctrl+F (handler in index.ts) or the close button. Filtering is
// wired centrally in index.ts (debounced); this component is pure UI.
//
// Layout uses inline styles (not Tailwind classes): extensions load at runtime,
// so the app's Tailwind build never scans this file — only classes the core app
// already uses would resolve. Inline styles + CSS variables always apply.

import { h, R, api } from "./runtime";
import { searchStore } from "./search-store";
import { isQueryActive } from "./query";
import { searchIcon } from "./icons";

export function SearchBar() {
  const ui = api().ui;
  if (!ui)
    return h(
      "div",
      { style: { padding: "10px", fontSize: "11px", color: "var(--color-text-muted)" } },
      "Update Safelight to use this panel.",
    );
  const t = ui.tokens;
  const react = R();
  const store = searchStore();
  const query: string = store((s) => s.query);
  const setQuery: (q: string) => void = store((s) => s.setQuery);
  const visible: boolean = store((s) => s.visible);
  const setVisible: (v: boolean) => void = store((s) => s.setVisible);
  const inputRef = react.useRef(null);

  // Focus (and select) the field whenever the bar becomes visible.
  react.useEffect(() => {
    if (!visible) return;
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, [visible]);

  if (!visible) return null;

  const close = () => {
    setQuery("");
    setVisible(false);
  };

  const active = isQueryActive(query);

  // The search field (magnifier + input + inline clear ×), fixed width.
  const field = h(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "20rem",
        maxWidth: "100%",
      },
    },
    h(
      "span",
      {
        style: {
          position: "absolute",
          left: "9px",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          color: t.textMuted,
          pointerEvents: "none",
        },
      },
      searchIcon(14),
    ),
    h("input", {
      ref: inputRef,
      type: "text",
      value: query,
      placeholder: "Search in library…",
      title:
        "Search filename, keywords, camera, lens, ISO, date. Try: heron 300mm · lens:70-300 · iso:>3200 · date:2024-06",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange: (e: any) => setQuery(e.target.value),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onKeyDown: (e: any) => {
        // Esc clears the text, or closes the bar when it's already empty.
        if (e.key === "Escape") {
          if (query) setQuery("");
          else close();
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onFocus: (e: any) => {
        e.currentTarget.style.borderColor = t.accent;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onBlur: (e: any) => {
        e.currentTarget.style.borderColor = t.borderSubtle;
      },
      style: {
        width: "100%",
        boxSizing: "border-box",
        borderRadius: "4px",
        border: `1px solid ${t.borderSubtle}`,
        background: t.surface2,
        color: t.textPrimary,
        fontSize: "11px",
        padding: "5px 26px 5px 28px", // top right(clear) bottom left(icon)
        outline: "none",
      },
    }),
    active
      ? h(
          "button",
          {
            onClick: () => setQuery(""),
            title: "Clear text (Esc)",
            "aria-label": "Clear search text",
            style: {
              position: "absolute",
              right: "6px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: t.textMuted,
              fontSize: "15px",
              lineHeight: 1,
            },
          },
          "×",
        )
      : null,
  );

  // The close button at the far right of the bar.
  const closeButton = h(
    ui.Button,
    {
      variant: "ghost",
      size: "sm",
      onClick: close,
      title: "Close search (Ctrl+F)",
      "aria-label": "Close search",
    },
    "×",
  );

  // The bar: field on the left, close button on the far right.
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "6px 12px",
        borderBottom: `1px solid ${t.borderSubtle}`,
        background: t.surface1,
      },
    },
    field,
    closeButton,
  );
}
