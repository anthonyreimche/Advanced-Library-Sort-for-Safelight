// The extension's own state: the live search query. Created through the app's
// zustand factory (api.stores.create) so the SearchBar and any panel re-render
// reactively, and the central grid-filter subscription (index.ts) can read it.

import type { SafelightAPI, StoreApi } from "./safelight";

export interface SearchState {
  query: string;
  setQuery(q: string): void;
  /** Whether the search bar is shown. Toggled by Ctrl+F / the close button. */
  visible: boolean;
  setVisible(v: boolean): void;
}

let store: StoreApi<SearchState> | null = null;

export function initSearchStore(api: SafelightAPI): StoreApi<SearchState> {
  store = api.stores.create<SearchState>((set) => ({
    // Hidden until invoked with Ctrl+F (Lightroom-style), so it never steals
    // focus on startup or occupies space when unused.
    query: "",
    setQuery: (q) => set({ query: q }),
    visible: false,
    setVisible: (v) => set({ visible: v }),
  }));
  return store;
}

export function searchStore(): StoreApi<SearchState> {
  if (!store) throw new Error("[library-search] search store used before activate()");
  return store;
}
