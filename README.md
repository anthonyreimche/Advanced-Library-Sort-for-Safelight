# Advanced Library Sort

**Find any shot in seconds.** This extension brings Lightroom-style sorting and
a live search bar to your SafeLight Library — so a folder of thousands of frames
becomes something you can actually navigate.

## Sort the way you shoot

Adds four new orders to the Library's sort menu, alongside the built-ins:

- **Camera** — group by camera body (make + model)
- **Lens** — group by the lens used
- **Focal Length** — order from widest to longest
- **ISO** — order from cleanest to noisiest

Use the toolbar's direction toggle to flip any of them. Photos missing that
piece of info sort to the end, so your tagged shots always come first.

## Search as you type

Press **Ctrl+F** to open the search bar (rebindable under
*Preferences ▸ Shortcuts*). Start typing and the grid filters instantly.

Type plain words to match across filename, keywords, camera, lens, and capture
settings — or target a single field with `field:value`. Multiple terms are
combined, so each one narrows the results further.

| You type | You get |
| --- | --- |
| `heron 300mm` | shots tagged *heron* taken at 300mm |
| `lens:70-300 iso:>3200` | a 70-300 lens, ISO above 3200 |
| `camera:D5300 date:2025-08` | that camera, in August 2025 |
| `filename:DSC_04` | filenames containing *DSC_04* |

**Fields:** `filename`, `keyword`, `camera`, `lens`, `type`, `label`, `iso`,
`focal`, `date`.

**Numbers** (`iso`, `focal`) accept ranges and comparisons:
`iso:6400`, `iso:>3200`, `focal:<=50`, `focal:200-300`.

## Save your go-to searches

The **Smart Searches** panel (docked on the left of the Library) keeps your
favorite query and filter combos one click away — *Keepers from this trip*,
*Telephoto wildlife*, *Anything over ISO 6400* — whatever you reach for often.

## Privacy

Everything runs locally over the photos already in your catalog. No indexing
service, no network requests, no data leaves your machine.

---

MIT licensed · by Anthony Reimche
