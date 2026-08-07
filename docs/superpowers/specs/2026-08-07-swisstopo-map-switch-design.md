# Swisstopo Map Switch — Design

> **Revision 2 (2026-08-07):** Supersedes the original raster-based approach. The user asked for the exact "light" basemap style used by coolzurich.ch (`ch.swisstopo.lightbasemap.vt`), which is a MapLibre GL vector tile style, not a raster WMTS layer — this changes the architecture section below. Also adds a new, related feature: rendering the existing per-lake GeoJSON ferry routes as an always-on overlay.
>
> **Revision 3 (2026-08-07):** The single toggle button is replaced with a labeled `<select>` (same visual pattern as the lake selector) so the user can see which map is active/selectable, not just click blindly. Also: Swisstopo becomes the default map style on first visit (no stored preference), not OpenStreetMap.

## Goal

Let the user toggle the base map on the main ship map (`components/ShipMap.tsx`) between OpenStreetMap and Swisstopo's official "light" basemap, without leaving the page. Additionally, show the ferry routes (already loaded per lake) as lines on the map.

## Scope

- In scope: `components/ShipMap.tsx` only.
- Out of scope: `app/route-editor/page.tsx` stays on OSM + OpenSeaMap overlay, unchanged.
- Only one Swisstopo layer is offered: the vector "light basemap" style `ch.swisstopo.lightbasemap.vt`, served as a MapLibre GL style from `https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json`. No satellite/aerial layer.
- Route overlay: the GeoJSON ferry routes for all currently connected lakes (already fetched by the existing `getCachedGeoJSONRoutes` call), rendered as `Polyline`s, always visible (no separate toggle).

## Architecture — Base map switch

- Leaflet's `TileLayer` only understands raster tile URL templates, so a MapLibre vector style needs a bridge: `@maplibre/maplibre-gl-leaflet` (`^0.1.3`), which wraps `maplibre-gl` as a Leaflet layer (`L.maplibreGL({ style })`) addable/removable from the existing `MapContainer` imperatively. Pin `maplibre-gl` to `^5.24.0` — `@maplibre/maplibre-gl-leaflet@0.1.3`'s peer range tops out at `^5.0.0` and does not yet cover `maplibre-gl` 6.x.
- Both packages are added as new dependencies (`package.json` + install). No API key required — `vectortiles.geo.admin.ch` is public.
- Add local state to `ShipMap.tsx`: `mapStyle: "osm" | "swisstopo"`.
  - Initialized from `localStorage` key `mapStyle` on mount.
  - Defaults to `"swisstopo"` when no stored value exists (Revision 3: Swisstopo is the default on first visit).
  - Every change is written back to `localStorage`.
- Rendering:
  - `mapStyle === "osm"`: keep the existing `<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png">`.
  - `mapStyle === "swisstopo"`: instead of a `TileLayer`, use a small helper component that grabs the Leaflet map instance via `useMap()` (from `react-leaflet`) and, in a `useEffect`, creates `L.maplibreGL({ style: 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json' })`, calls `.addTo(map)`, and removes it (`map.removeLayer(...)`) on cleanup/unmount. This component is only rendered while `mapStyle === "swisstopo"`, so switching back to `"osm"` unmounts it and the effect cleanup removes the MapLibre layer.
  - No attribution string is manually set — `maplibre-gl-leaflet` pulls attribution from the style's own `sources` metadata (swisstopo's style already declares `© swisstopo`), matching how the rest of the map's attribution is sourced.

## Architecture — Route overlay

- `ShipMap.tsx` already loads GeoJSON routes per connected lake in its existing `loadAllRoutes` effect (currently only used for a console log). That effect is extended to keep the loaded `ShipRouteData[]` in state instead of discarding it.
- For each route, `coordinates: {lat, lon}[]` (from `lib/geojson-routes.ts`) maps directly to a Leaflet `positions` array: `route.coordinates.map(c => [c.lat, c.lon])`.
- Rendered as one `<Polyline>` per route, `pathOptions={{ color: '#0c274a', weight: 3, opacity: 0.5 }}` — reuses the existing brand-blue (`#0c274a`, already used for the ship icon background) at low-ish opacity so lines read as a background layer under the ship/station markers, not competing with them. This differs intentionally from the route *editor*'s in-progress-route styling (`#ec4899`, weight 4, opacity 0.8), which needs to stand out while actively drawing.
- Routes re-render whenever `connectedLakeIds` changes (same dependency the existing load effect already uses), and are unaffected by `mapStyle` — they render as a Leaflet `Polyline` regardless of which base layer is active underneath.

## UI

- **Revision 3:** the icon-button toggle is replaced by a `<select>`, styled like the existing lake selector (`components/ShipMap.tsx`'s desktop dropdown: white/dark-gray rounded card, `ChevronDown` icon overlay, `appearance-none` native select) — so the two options are explicitly labeled ("OpenStreetMap" / "Swisstopo") rather than inferred from a single icon and click.
- Positioned as a map overlay at `top-20 right-3 z-[1000]` (below the Leaflet zoom control, which occupies `top-right`) — doesn't collide with the lake selector (`top-3 left-3 z-[1000]`).
- Selecting an option sets `mapStyle` directly (no more toggle-between-two logic) and persists it to `localStorage`.
- Route overlay has no dedicated UI — it's always on, per the "immer sichtbar" decision.

## Persistence

- Selected base map style persists across reloads and future visits via `localStorage`, same mechanism as the existing theme/language toggle.
- Route overlay has no persisted state (always on).

## Non-goals

- No satellite/aerial Swisstopo layer.
- No changes to the route editor page.
- No route visibility toggle — routes are always rendered when loaded.
- No server-side/env-var configuration — both the OSM tiles and the Swisstopo vector style are public, keyless endpoints.
