// Minimal type surface SafeLight exposes to this extension. The repo-root
// `extensions/` folder is outside the main tsconfig, so this can't import
// "@/..." — it vendors the shapes it needs. These mirror the core types in
// src/catalog/types.ts and src/extensions/types.ts; only the fields this
// extension touches are declared.

// ── Catalog data ────────────────────────────────────────────────────────────

export type ColorLabel = "none" | "red" | "yellow" | "green" | "blue" | "purple";
export type FlagStatus = "none" | "pick" | "reject";

export interface ExifData {
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  focalLength?: number; // mm
  iso?: number;
  dateTimeOriginal?: string;
  [key: string]: unknown;
}

export interface CatalogPhoto {
  id: string;
  filename: string;
  mimeType: string;
  rating: number;
  colorLabel: ColorLabel;
  flag: FlagStatus;
  keywords: string[];
  dateCreated: number; // epoch ms
  dateImported: number;
  exif: ExifData;
  // …other fields exist in core but aren't used here.
  [key: string]: unknown;
}

// ── Library filter (built-in rating/flag/label, for saved-search restore) ────

export type FlagFilter = "any" | "pick" | "reject";
export type LabelFilter = "any" | ColorLabel;
export type RatingOp = "lt" | "lte" | "gt" | "gte" | "eq" | "neq";

export interface LibraryFilter {
  rating: number;
  ratingOp: RatingOp;
  flag: FlagFilter;
  label: LabelFilter;
  keywords: string[];
}

// ── Zustand-ish store handles ────────────────────────────────────────────────

export interface StoreApi<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState(): T;
  setState(partial: Partial<T> | ((s: T) => Partial<T>), replace?: boolean): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}

export type StateCreator<T> = (
  set: (partial: Partial<T> | ((s: T) => Partial<T>), replace?: boolean) => void,
  get: () => T,
) => T;

export interface UIStoreState {
  filter: LibraryFilter;
  setFilter(patch: Partial<LibraryFilter>): void;
  clearFilters(): void;
}

// ── Contributions this extension registers ───────────────────────────────────

export interface GridFilterContribution {
  id: string;
  test(photo: CatalogPhoto): boolean;
  onClear?(): void;
}

export type SlotName = "library-toolbar" | "library-subbar";

export interface SlotContribution {
  id: string;
  slot: SlotName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: (...args: any[]) => any;
  order?: number;
}

export interface KeyActionContribution {
  id: string;
  label: string;
  category?: "General" | "Develop" | "Library";
  defaultCombo: string;
  handler(): void;
}

export interface PanelContribution {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: (...args: any[]) => any;
  slot?: "develop-right" | "develop-left" | "none";
  order?: number;
  defaultDock?: {
    module: "library" | "develop";
    direction: "left" | "right";
    order?: number;
    width?: number;
    height?: number;
  };
}

export interface LibrarySortContribution {
  id: string;
  label: string;
  compare(a: CatalogPhoto, b: CatalogPhoto): number;
}

export type SettingsField =
  | { key: string; label: string; hint?: string; type: "boolean"; default: boolean }
  | { key: string; label: string; hint?: string; type: "string"; default: string; placeholder?: string };

export interface SettingsContribution {
  title?: string;
  fields: SettingsField[];
  order?: number;
}

// ── The API handed to activate() ─────────────────────────────────────────────

export interface SafelightAPI {
  version: 1;
  extensionId: string;
  /** The app's React instance — use this, never a bundled copy. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  react: any;
  registerGridFilter(c: GridFilterContribution): void;
  registerSlot(c: SlotContribution): void;
  registerLibrarySort(c: LibrarySortContribution): void;
  registerKeybinding(c: KeyActionContribution): void;
  registerPanel(c: PanelContribution): void;
  registerSettings(c: SettingsContribution): void;
  settings: {
    get<T>(key: string, fallback: T): T;
    set(key: string, value: unknown): void;
    onChange(cb: (key: string, value: unknown) => void): () => void;
  };
  stores: {
    create<T>(initializer: StateCreator<T>): StoreApi<T>;
    useUIStore: StoreApi<UIStoreState>;
    [key: string]: unknown;
  };
  keybindings: { getBinding(actionId: string): string };
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
