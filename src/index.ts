// Advanced Library Sort — optional SafeLight extension.
//
// Adds Lightroom-style Library sort orders (camera, lens, focal length, ISO) to
// the toolbar's sort dropdown, plus a live search bar (filename / keyword /
// EXIF / query syntax) and a "Smart Searches" panel for saved query+filter
// combos. All logic lives here; core only provides generic hooks: a grid-filter
// predicate registry, a UI slot, and a Library-sort registry. The grid (and
// culling navigation) apply our predicate and comparator automatically.

import type { SafelightAPI } from "./safelight";
import { initRuntime } from "./runtime";
import { initSearchStore } from "./search-store";
import { buildMatcher } from "./query";
import { SORTS } from "./sort";
import { SearchBar } from "./SearchBar";
import { SmartSearchesPanel } from "./SmartSearches";

const ID = "com.safelight.advanced-library-sort";
const GRID_FILTER_ID = `${ID}.filter`;
const DEBOUNCE_MS = 150;

export function activate(api: SafelightAPI): void {
  initRuntime(api);
  const store = initSearchStore(api);

  // ── Sort orders (camera / lens / focal length / ISO) ───────────────────────
  // Added to the core sort dropdown; core resolves the comparator by id.
  for (const sort of SORTS) api.registerLibrarySort(sort);

  // ── Search ─────────────────────────────────────────────────────────────────
  // Rebuild the grid predicate from the current query and (re)register it.
  // Re-registering the same id replaces the entry, so the grid re-derives.
  const applyFilter = () => {
    const matcher = buildMatcher(store.getState().query);
    api.registerGridFilter({
      id: GRID_FILTER_ID,
      test: matcher,
      // "Clear filters" (core) empties the search box too.
      onClear: () => store.getState().setQuery(""),
    });
  };

  // Register once up-front (matches everything while the box is empty), then
  // debounce updates so we don't rebuild on every keystroke.
  applyFilter();
  let timer: number | undefined;
  store.subscribe((s, prev) => {
    if (s.query === prev.query) return;
    if (timer !== undefined) window.clearTimeout(timer);
    timer = window.setTimeout(applyFilter, DEBOUNCE_MS);
  });

  // The search bar gets its own full-width bar below the Library toolbar.
  api.registerSlot({
    id: `${ID}.bar`,
    slot: "library-subbar",
    component: SearchBar,
    order: 0,
  });

  // Ctrl+F toggles the search bar (rebindable in Preferences ▸ Shortcuts).
  // Opening focuses it (SearchBar effect); closing clears the query.
  api.registerKeybinding({
    id: `${ID}.focus`,
    label: "Toggle library search",
    category: "Library",
    defaultCombo: "Ctrl+F",
    handler: () => {
      const s = store.getState();
      const next = !s.visible;
      s.setVisible(next);
      if (!next) s.setQuery("");
    },
  });

  // Saved searches panel, docked on the left of the Library.
  api.registerPanel({
    id: `${ID}.smart`,
    title: "Smart Searches",
    component: SmartSearchesPanel,
    defaultDock: { module: "library", direction: "left", order: 20, height: 220 },
  });
}

export function deactivate(): void {
  // No standing side effects: the host sweeps the registry (grid filter, slot,
  // library sorts, panel, keybinding) when the extension is disabled/uninstalled.
}
