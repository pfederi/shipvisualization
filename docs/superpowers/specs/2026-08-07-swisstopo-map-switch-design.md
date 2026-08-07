# Swisstopo Map Switch — Design

> This spec went through 5 revisions as requirements evolved during implementation (raster→vector basemap, toggle→native-select→custom popover, routes always-on→swisstopo-only). Earlier drafts tracked each change as a prepended revision note, which drifted out of sync with the body. This version describes the final, shipped state directly; history is preserved in git (`git log -p -- docs/superpowers/specs/2026-08-07-swisstopo-map-switch-design.md`) and in `docs/superpowers/plans/2026-08-07-swisstopo-map-switch.md`, which still carries the full task-by-task revision trail.

## Goal

Let the user switch the main ship map's (`components/ShipMap.tsx`) base layer between OpenStreetMap and Swisstopo's "light" vector basemap, defaulting to Swisstopo on first visit. Additionally, show the ferry routes (already loaded per lake) as a Swisstopo-only overlay.

## Scope

- In scope: `components/ShipMap.tsx` only.
- Out of scope: `app/route-editor/page.tsx` stays on OSM + OpenSeaMap overlay, unchanged.
- Only one Swisstopo layer is offered: the vector "light basemap" style `ch.swisstopo.lightbasemap.vt`, served as a MapLibre GL style from `https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json`. No satellite/aerial layer.
- Route overlay: the GeoJSON ferry routes for all currently connected lakes (already fetched by the existing `getCachedGeoJSONRoutes` call), rendered as `Polyline`s, visible only while the Swisstopo basemap is active.

## Architecture — Base map switch

- Leaflet's `TileLayer` only understands raster tile URL templates, so the MapLibre vector style needs a bridge: `@maplibre/maplibre-gl-leaflet` (`^0.1.3`), which wraps `maplibre-gl` as a Leaflet layer (`L.maplibreGL({ style })`) addable/removable from the existing `MapContainer` imperatively. `maplibre-gl` is pinned to `^5.24.0` — `@maplibre/maplibre-gl-leaflet@0.1.3`'s peer range tops out at `^5.0.0` and does not cover `maplibre-gl` 6.x.
- Both packages are dependencies (`package.json` + lockfile). No API key required — `vectortiles.geo.admin.ch` is public.
- Local state in `ShipMap.tsx`: `mapStyle: "osm" | "swisstopo"`.
  - Initialized from `localStorage` key `mapStyle` on mount.
  - Defaults to `"swisstopo"` when no stored value exists.
  - Every change is written back to `localStorage`.
- Rendering:
  - `mapStyle === "osm"`: the existing `<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png">`.
  - `mapStyle === "swisstopo"`: instead of a `TileLayer`, a small helper component (`SwisstopoLayer`) grabs the Leaflet map instance via `useMap()` and, in a `useEffect`, creates `L.maplibreGL({ style: 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json' })`, calls `.addTo(map)`, and removes it (`map.removeLayer(...)`) on cleanup/unmount. This component is only rendered while `mapStyle === "swisstopo"`, so switching back to `"osm"` unmounts it and the effect cleanup removes the MapLibre layer.
  - No attribution string is manually set — `maplibre-gl-leaflet` pulls attribution from the style's own `sources` metadata (swisstopo's style declares `© swisstopo`).

## Architecture — Route overlay

- `ShipMap.tsx` already loads GeoJSON routes per connected lake in its existing `loadAllRoutes` effect (originally only used for a console log). That effect keeps the loaded `ShipRouteData[]` in state (`shipRoutes`) regardless of which base map is active — only rendering is gated, not the fetch.
- For each route, `coordinates: {lat, lon}[]` (from `lib/geojson-routes.ts`) maps directly to a Leaflet `positions` array: `route.coordinates.map(c => [c.lat, c.lon])`.
- Rendered only while `mapStyle === 'swisstopo'` — hidden entirely on OSM. Styling is `pathOptions={{ color: '#60a5fa', weight: 1.5, opacity: 0.8, dashArray: '4 6' }}` — a lighter blue (Tailwind `blue-400`), thin, dashed. Chosen to read well against the light Swisstopo vector basemap specifically; hidden on OSM rather than maintaining a second palette for a combination that clashed visually. This differs intentionally from the route *editor*'s in-progress-route styling (`#ec4899`, weight 4, opacity 0.8, solid), which needs to stand out while actively drawing.
- Routes re-render whenever `connectedLakeIds` changes; visibility additionally depends on `mapStyle` via a render-time conditional.

## UI

- The base-map control is a plain icon button (`Layers` icon) that reveals a custom-styled popover panel on click — deliberately not a native browser `<select>`, matching the pattern used by coolzurich.ch. The panel lists "OpenStreetMap" and "Swisstopo" as styled rows (not `<option>`s); the currently active style is highlighted (brand-blue background/text). Clicking a row sets `mapStyle` and closes the panel; clicking outside the panel closes it without changing the selection (via a `mousedown` listener on `document`, scoped to while the panel is open).
- Positioned as a map overlay at `top-20 right-3 z-[1000]` (below the Leaflet zoom control, which occupies `top-right`) — doesn't collide with the lake selector (`top-3 left-3 z-[1000]`).
- Route overlay has no dedicated UI — it's automatically shown/hidden based on `mapStyle`, no separate toggle.

## Persistence

- Selected base map style persists across reloads and future visits via `localStorage`, same mechanism as the existing theme/language toggle.
- Route overlay has no persisted state — its visibility is fully derived from `mapStyle`.

## Non-goals

- No satellite/aerial Swisstopo layer.
- No changes to the route editor page.
- No route visibility toggle independent of `mapStyle`.
- No server-side/env-var configuration — both the OSM tiles and the Swisstopo vector style are public, keyless endpoints.

## Known follow-ups (not blocking, tracked for awareness)

Surfaced by the final whole-branch review (see `docs/superpowers/plans/2026-08-07-swisstopo-map-switch.md` and the SDD ledger for full detail):

- No fallback if WebGL is unavailable or `vectortiles.geo.admin.ch` has an outage — since Swisstopo is now the default, this is a first-load risk for a subset of users, not just a degraded opt-in feature.
- The popover control lacks the accessibility affordances the earlier native `<select>` had for free (`aria-haspopup`/`aria-expanded`, `role="menu"`, Escape-to-close, focus return).
- `maplibre-gl`'s client bundle weight (~280 KB gzip) loads unconditionally once `ShipMap` is used, even for OSM-preferring users, since `require()` inside an effect is still statically bundled by webpack.
- The `© swisstopo` attribution may linger in Leaflet's attribution control after switching back to OSM (an upstream `maplibre-gl-leaflet` quirk in how it deregisters attribution on removal).
