# Swisstopo Map Switch — Design

## Goal

Let the user toggle the base map on the main ship map (`components/ShipMap.tsx`) between the current OpenStreetMap tiles and Swisstopo's official Swiss map, without leaving the page.

## Scope

- In scope: `components/ShipMap.tsx` only.
- Out of scope: `app/route-editor/page.tsx` stays on OSM + OpenSeaMap overlay, unchanged.
- Only one Swisstopo layer is offered: `ch.swisstopo.pixelkarte-farbe` (the standard color national map). No satellite/aerial layer for now.

## Architecture

- Add local state to `ShipMap.tsx`: `mapStyle: "osm" | "swisstopo"`.
  - Initialized from `localStorage` key `mapStyle` on mount (hydration-safe mount guard, same pattern as `ThemeLanguageToggle.tsx`).
  - Defaults to `"osm"` when no stored value exists.
  - Every change is written back to `localStorage`.
- Replace the single `<TileLayer>` with a conditional pick between two configs, keyed by `mapStyle`:
  - OSM (current): `url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"`, existing OSM attribution.
  - Swisstopo: `url="https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg"`, attribution `© swisstopo`. Public WMTS endpoint, EPSG:3857 (Web Mercator) — no API key, drops directly into Leaflet.
  - The `<TileLayer>` element gets `key={mapStyle}` so switching forces a clean remount instead of mixing cached tiles from the previous style.

## UI

- New compact icon-button control, styled like `ThemeLanguageToggle.tsx` (`bg-white/10 hover:bg-white/20`, Lucide icon, `title` tooltip).
- Positioned as a map overlay at `top-3 right-3 z-[1000]` — opposite corner from the existing lake selector (`top-3 left-3 z-[1000]`) so the two controls don't collide.
- Single click toggles between the two styles. Icon: Lucide `Layers` (or `Mountain`). Tooltip text reflects the *target* style ("Zu Swisstopo wechseln" / "Zu OpenStreetMap wechseln").
- No dropdown — just a two-state toggle, since only one Swisstopo layer is offered.

## Persistence

- Selected style persists across reloads and future visits via `localStorage`, same mechanism as the existing theme/language toggle.

## Non-goals

- No satellite/aerial Swisstopo layer.
- No changes to the route editor page.
- No server-side/env-var configuration — both tile sources are public, keyless endpoints.
