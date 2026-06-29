// "Smart Searches" panel (Library dock): save a query + the current
// rating/flag/label filter as a named combo, restore it in one click, delete
// it. Persisted per-extension via api.settings, so it survives restarts and
// syncs across windows. Lives entirely in the extension — core's Folders panel
// is untouched.

import { h, R, api } from "./runtime";
import { searchStore } from "./search-store";
import { isQueryActive } from "./query";
import { searchIcon } from "./icons";
import type { LibraryFilter } from "./safelight";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filter: LibraryFilter;
}

const KEY = "savedSearches";

function load(): SavedSearch[] {
  const raw = api().settings.get<SavedSearch[]>(KEY, []);
  return Array.isArray(raw) ? raw : [];
}

function save(list: SavedSearch[]): void {
  api().settings.set(KEY, list);
}

// Short human summary of a saved filter, e.g. "≥3★ · red".
function filterSummary(f: LibraryFilter): string {
  const parts: string[] = [];
  const opSym: Record<string, string> = {
    lt: "<",
    lte: "≤",
    gt: ">",
    gte: "≥",
    eq: "=",
    neq: "≠",
  };
  if (f.rating > 0 || f.ratingOp !== "gte") parts.push(`${opSym[f.ratingOp] ?? "≥"}${f.rating}★`);
  if (f.flag !== "any") parts.push(f.flag);
  if (f.label !== "any") parts.push(f.label);
  if (f.keywords.length) parts.push(f.keywords.join(", "));
  return parts.join(" · ");
}

export function SmartSearchesPanel() {
  const ui = api().ui;
  if (!ui)
    return h(
      "div",
      { style: { padding: "10px", fontSize: "11px", color: "var(--color-text-muted)" } },
      "Update Safelight to use this panel.",
    );
  const t = ui.tokens;
  const react = R();
  const [list, setList] = react.useState(load);
  const [name, setName] = react.useState("");

  // Keep in sync with writes from other windows.
  react.useEffect(() => {
    return api().settings.onChange((key: string) => {
      if (key === KEY) setList(load());
    });
  }, []);

  const liveQuery: string = searchStore()((s) => s.query);
  const liveFilter: LibraryFilter = api().stores.useUIStore((s) => s.filter);
  const canSave = isQueryActive(liveQuery) || filterSummary(liveFilter) !== "";

  const commit = (next: SavedSearch[]) => {
    setList(next);
    save(next);
  };

  const onSave = () => {
    const label =
      name.trim() ||
      liveQuery.trim() ||
      filterSummary(liveFilter) ||
      "Untitled search";
    const entry: SavedSearch = {
      // Deterministic-ish unique id without Date/Math.random reliance issues.
      id: `s_${label.replace(/\W+/g, "-")}_${list.length}`,
      name: label,
      query: liveQuery,
      filter: liveFilter,
    };
    commit([...list, entry]);
    setName("");
  };

  const onApply = (s: SavedSearch) => {
    searchStore().getState().setQuery(s.query);
    // setFilter merges a full LibraryFilter, so this fully restores the combo.
    api().stores.useUIStore.getState().setFilter(s.filter);
  };

  const onDelete = (id: string) => {
    commit(list.filter((s: SavedSearch) => s.id !== id));
  };

  // Name field stays a bare <input> (not api.ui TextInput) so it keeps
  // Enter-to-save; the kit's TextInput contract has no onKeyDown. Colours come
  // from api.ui.tokens so it still matches the app.
  const textInput = {
    minWidth: 0,
    flex: 1,
    boxSizing: "border-box" as const,
    borderRadius: "4px",
    border: `1px solid ${t.borderSubtle}`,
    background: t.surface2,
    color: t.textPrimary,
    fontSize: "11px",
    padding: "4px 8px",
    outline: "none",
  };
  const ellipsis = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  };

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "8px", padding: "8px" } },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "4px" } },
      h("input", {
        type: "text",
        value: name,
        placeholder: "Name this search…",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange: (e: any) => setName(e.target.value),
        // Enter saves (when there's something to save).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKeyDown: (e: any) => {
          if (e.key === "Enter" && canSave) onSave();
        },
        style: textInput,
      }),
      h(
        ui.Button,
        {
          variant: "secondary",
          size: "sm",
          onClick: onSave,
          disabled: !canSave,
          title: canSave
            ? "Save the current search + filters"
            : "Type a search or set a filter first",
        },
        "Save",
      ),
    ),
    list.length === 0
      ? h(
          "p",
          {
            style: {
              padding: "8px 4px",
              fontSize: "10px",
              color: t.textMuted,
            },
          },
          "No saved searches yet. Search or filter the Library, then Save.",
        )
      : h(
          "ul",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              listStyle: "none",
              margin: 0,
              padding: 0,
            },
          },
          ...list.map((s: SavedSearch) =>
            h(
              "li",
              {
                key: s.id,
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "4px",
                  padding: "4px",
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMouseEnter: (e: any) => {
                  e.currentTarget.style.background = t.surface2;
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMouseLeave: (e: any) => {
                  e.currentTarget.style.background = "transparent";
                },
              },
              h(
                "button",
                {
                  onClick: () => onApply(s),
                  title: "Apply this saved search",
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  },
                },
                h(
                  "span",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      maxWidth: "100%",
                      color: t.textPrimary,
                      fontSize: "11px",
                    },
                  },
                  h(
                    "span",
                    { style: { display: "flex", color: t.textMuted } },
                    searchIcon(12),
                  ),
                  h("span", { style: ellipsis }, s.name),
                ),
                h(
                  "span",
                  {
                    style: {
                      maxWidth: "100%",
                      fontSize: "9px",
                      color: t.textMuted,
                      ...ellipsis,
                    },
                  },
                  [s.query, filterSummary(s.filter)].filter(Boolean).join("  ·  ") ||
                    "all photos",
                ),
              ),
              h(
                "button",
                {
                  onClick: () => onDelete(s.id),
                  title: "Delete saved search",
                  "aria-label": "Delete saved search",
                  style: {
                    background: "transparent",
                    border: "none",
                    padding: "0 4px",
                    cursor: "pointer",
                    color: t.textMuted,
                    fontSize: "13px",
                    lineHeight: 1,
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onMouseEnter: (e: any) => {
                    e.currentTarget.style.color = "#e06666";
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onMouseLeave: (e: any) => {
                    e.currentTarget.style.color = t.textMuted;
                  },
                },
                "×",
              ),
            ),
          ),
        ),
  );
}
