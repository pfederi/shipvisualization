# Swisstopo Map Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Revision 2:** Task 1 below supersedes an earlier raster-tile-based implementation already committed to this branch (commit `22c452e`, "Add OSM/Swisstopo base map toggle to ShipMap"). That version used `ch.swisstopo.pixelkarte-farbe` raster tiles. This revision replaces the Swisstopo side with the vector "light basemap" style instead, per updated user request, and adds a new Task 2 (route overlay) that did not exist in the original plan. If you are executing this plan fresh (not continuing from that commit), Task 1's steps describe edits against the current file — read Step 1 of Task 1 carefully, it starts from the state left by commit `22c452e`, not from a bare `TileLayer`.
>
> **Revision 3:** Tasks 1 and 2 are complete and reviewed (commits `d7d1824`, `2d2c9d8`). Task 3 below is a new, additional task: replace the icon-button toggle built in Task 1 with a labeled `<select>`, and change the default `mapStyle` (when no `localStorage` value exists) from `"osm"` to `"swisstopo"`.

**Goal:** Add a toggle on the main ship map that switches the base layer between OpenStreetMap and Swisstopo's vector "light basemap" style, persisted across reloads. Also render the existing per-lake ferry routes as an always-visible overlay.

**Architecture:** `mapStyle` state in `components/ShipMap.tsx`, persisted to `localStorage`, switches between the existing OSM `TileLayer` and a new `SwisstopoLayer` helper component that bridges a MapLibre GL vector style into the Leaflet map via `@maplibre/maplibre-gl-leaflet`. Separately, the GeoJSON ferry routes already fetched by the existing route-loading effect are kept in state and rendered as `Polyline`s.

**Tech Stack:** Next.js (App Router) + React + TypeScript, `react-leaflet` v5 / `leaflet` v1.9, `maplibre-gl` (new, pinned `^5.24.0`), `@maplibre/maplibre-gl-leaflet` (new, `^0.1.3`), Tailwind CSS, `lucide-react` icons.

## Global Constraints

- Scope is `components/ShipMap.tsx` (and `package.json`/lockfile for the new dependencies) only. Do not touch `app/route-editor/page.tsx`.
- Swisstopo layer is the vector style `ch.swisstopo.lightbasemap.vt`, served from `https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json` — no satellite/aerial layer. Task 1 built a two-state icon-button toggle; Task 3 replaces it with a labeled `<select>` (same position, `top-20 right-3 z-[1000]`).
- Default `mapStyle` when no `localStorage` value exists: `"swisstopo"` as of Task 3 (Task 1 originally defaulted to `"osm"` — Task 3 changes this one line).
- `maplibre-gl` **must** be pinned to `^5.24.0`, not the latest major (6.x) — `@maplibre/maplibre-gl-leaflet@0.1.3`'s peer dependency range tops out at `^5.0.0` and does not cover 6.x. Installing 6.x will produce an unmet-peer-dependency warning and is unsupported by the binding.
- Persist the chosen base map style in `localStorage` under key `mapStyle` with values `'osm' | 'swisstopo'` — this is already implemented (commit `22c452e`) and must be preserved, not reworked.
- Route overlay is always visible — no toggle, no persisted state. It renders for whichever lakes are currently connected/loaded (`connectedLakeIds`), independent of `mapStyle`.
- **No test framework is configured in this repo** (no Jest/Vitest/RTL). Do not introduce one. Verification is manual: run the dev server, use the browser and DevTools (Network tab for tile/style requests, Application tab for `localStorage`, Console for errors).
- Follow existing code style in `ShipMap.tsx`: the file uses `require('leaflet')` / `require('react-leaflet')` inside component bodies and effects (not top-level imports) for anything that touches `window` at module-load time, specifically to stay SSR-safe — see the existing `stationIcon`/`shipIcons` `useMemo`s for the pattern. Follow it for the new MapLibre bridge code too.

---

### Task 1: Swisstopo light basemap via MapLibre GL bridge

**Files:**
- Modify: `components/ShipMap.tsx`
- Modify: `package.json` (and lockfile, via `npm install`)

**Interfaces:**
- Consumes: the existing `mapStyle` state and `toggleMapStyle` handler (already implemented in commit `22c452e` — do not rename or move them).
- Produces: a new module-level component `SwisstopoLayer` (no props, returns `null`, side-effects the Leaflet map via `useMap()`) that Task 2 does not depend on and does not need to know about.

- [ ] **Step 1: Read the current file state**

Read `components/ShipMap.tsx` in full first. It already contains (from a prior commit) a `mapStyle` state, a `toggleMapStyle` handler, a `tileConfig` object computing `{ url, attribution }` for `'osm' | 'swisstopo'`, and a single `<TileLayer key={mapStyle} attribution={tileConfig.attribution} url={tileConfig.url} />` inside `<MapContainer>`. This task removes `tileConfig` and replaces that `TileLayer` usage with a conditional between the OSM `TileLayer` and a new `SwisstopoLayer` component — it does NOT touch the toggle button UI, the `mapStyle` state, or `toggleMapStyle`.

- [ ] **Step 2: Install the new dependencies**

Run:

```bash
npm install maplibre-gl@^5.24.0 @maplibre/maplibre-gl-leaflet@^0.1.3
```

Verify afterwards that `package.json` lists both under `"dependencies"` with those ranges, and that `maplibre-gl`'s installed version (check `node_modules/maplibre-gl/package.json`, field `"version"`) is a `5.x` release, not `6.x`.

- [ ] **Step 3: Add the MapLibre CSS import**

In `components/ShipMap.tsx`, directly below the existing `import 'leaflet/dist/leaflet.css'` line, add:

```tsx
import 'maplibre-gl/dist/maplibre-gl.css'
```

- [ ] **Step 4: Add the `SwisstopoLayer` helper component**

Immediately after the block of `dynamic(...)` component declarations (`MapContainer`, `TileLayer`, `Marker`, `Tooltip`, `ZoomControl`) and before the `ShipMapProps` interface, add:

```tsx
function SwisstopoLayer() {
  const { useMap } = require('react-leaflet')
  const map = useMap()

  useEffect(() => {
    require('@maplibre/maplibre-gl-leaflet')
    const L = require('leaflet')
    const gl = (L as any).maplibreGL({
      style: 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json',
    }).addTo(map)

    return () => {
      map.removeLayer(gl)
    }
  }, [map])

  return null
}
```

This mirrors the existing `MapEvents` helper pattern used in `app/route-editor/page.tsx` (a small component that calls a react-leaflet hook via `require(...)` inside its body, since it only ever renders client-side as a descendant of `MapContainer`). `require('@maplibre/maplibre-gl-leaflet')` pulls in `maplibre-gl` as its own dependency and patches the `L` namespace with `.maplibreGL(...)` as a side effect of being required — this only happens inside the `useEffect`, so it never runs during any server-side pass.

- [ ] **Step 5: Remove `tileConfig` and update the `TileLayer` usage**

Find and delete the `tileConfig` object (it computes `{ url, attribution }` from `mapStyle`, currently defined just above the component's `return (`):

```tsx
  const tileConfig = mapStyle === 'swisstopo'
    ? {
        url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
        attribution: '&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
      }
    : {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
```

Then find the current `TileLayer` usage inside `<MapContainer>`:

```tsx
        <TileLayer
          key={mapStyle}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />
```

Replace it with:

```tsx
        {mapStyle === 'osm' ? (
          <TileLayer
            key="osm"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <SwisstopoLayer key="swisstopo" />
        )}
```

- [ ] **Step 6: Start the dev server and verify manually**

Run: `npm run dev`

Open the app in a browser and check:
1. The map still loads with OSM tiles by default, same as before this task.
2. Clicking the existing top-right toggle button now swaps to Swisstopo's *light vector* basemap — thin light-colored streets/labels, visually similar to https://coolzurich.ch/, NOT the previous colorful raster map.
3. In DevTools Network tab, confirm a request to `vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json` fires when switching to Swisstopo, plus subsequent vector tile requests to the same host.
4. In DevTools Console, confirm no errors (in particular no "L.maplibreGL is not a function" — if that appears, `@maplibre/maplibre-gl-leaflet` did not patch `L` correctly, check the `require` order in Step 4).
5. Clicking again swaps back to OSM cleanly, and toggling swisstopo→osm→swisstopo repeatedly does not leave duplicate/stale vector layers visible or throw errors (this exercises the `useEffect` cleanup in `SwisstopoLayer`).
6. Reloading the page with `mapStyle` = `"swisstopo"` in `localStorage` opens directly on the vector basemap.
7. `app/route-editor/page.tsx` is unaffected.

Expected: all checks pass.

- [ ] **Step 7: Commit**

```bash
git add components/ShipMap.tsx package.json package-lock.json
git commit -m "$(cat <<'EOF'
Switch Swisstopo base map to the light vector basemap style

Replaces the earlier raster pixelkarte-farbe layer with
ch.swisstopo.lightbasemap.vt, bridged into Leaflet via
@maplibre/maplibre-gl-leaflet, matching the style used by
coolzurich.ch.
EOF
)"
```

---

### Task 2: Render ferry routes as a map overlay

**Files:**
- Modify: `components/ShipMap.tsx`

**Interfaces:**
- Consumes: `getCachedGeoJSONRoutes` and the `ShipRouteData` type from `lib/geojson-routes.ts` (`ShipRouteData` has `coordinates: { lat: number; lon: number }[]`) — both already imported/used elsewhere in this file for the existing route-count log; this task extends that same effect rather than adding a new one. Also consumes the existing `connectedLakeIds` memoized value.
- Produces: nothing consumed by other files.

- [ ] **Step 1: Add the `Polyline` dynamic import and `ShipRouteData` type import**

In `components/ShipMap.tsx`, extend the existing import:

```tsx
import { getCachedGeoJSONRoutes, ShipRouteData } from '@/lib/geojson-routes'
```

and add a new dynamic component declaration alongside the existing ones (`MapContainer`, `TileLayer`, `Marker`, `Tooltip`, `ZoomControl`):

```tsx
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })
```

- [ ] **Step 2: Add `shipRoutes` state**

Near the other `useState` declarations at the top of the component body, add:

```tsx
const [shipRoutes, setShipRoutes] = useState<ShipRouteData[]>([])
```

- [ ] **Step 3: Store the loaded routes instead of only counting them**

Find the existing `loadAllRoutes` function (inside the effect that also sets `isClient`):

```tsx
    // Lade GeoJSON-Routen für alle verbundenen Seen
    const loadAllRoutes = async () => {
      try {
        const routePromises = connectedLakeIds.map(lakeId => 
          getCachedGeoJSONRoutes(LAKES[lakeId].geojsonPath)
        )
        const allRoutes = await Promise.all(routePromises)
        const totalRoutes = allRoutes.reduce((sum, routes) => sum + routes.length, 0)
        const lakeNames = connectedLakeIds.map(id => LAKES[id].name).join(', ')
        console.log(`🗺️ ShipMap: ${totalRoutes} GeoJSON-Routen geladen für ${lakeNames}`)
      } catch (error) {
        console.error(`❌ ShipMap: Fehler beim Laden der GeoJSON-Routen:`, error)
      }
    }
    loadAllRoutes()
```

Add one line, right after the existing `console.log`, so the loaded routes are kept for rendering (leave everything else in this block unchanged):

```tsx
    // Lade GeoJSON-Routen für alle verbundenen Seen
    const loadAllRoutes = async () => {
      try {
        const routePromises = connectedLakeIds.map(lakeId => 
          getCachedGeoJSONRoutes(LAKES[lakeId].geojsonPath)
        )
        const allRoutes = await Promise.all(routePromises)
        const totalRoutes = allRoutes.reduce((sum, routes) => sum + routes.length, 0)
        const lakeNames = connectedLakeIds.map(id => LAKES[id].name).join(', ')
        console.log(`🗺️ ShipMap: ${totalRoutes} GeoJSON-Routen geladen für ${lakeNames}`)
        setShipRoutes(allRoutes.flat())
      } catch (error) {
        console.error(`❌ ShipMap: Fehler beim Laden der GeoJSON-Routen:`, error)
      }
    }
    loadAllRoutes()
```

- [ ] **Step 4: Render the routes inside `MapContainer`**

Inside `<MapContainer>`, directly after `<ZoomControl position="topright" />` and before the `{/* Stationen */}` block, add:

```tsx
        {/* Schiffsrouten */}
        {shipRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.coordinates.map(c => [c.lat, c.lon] as [number, number])}
            pathOptions={{ color: '#0c274a', weight: 3, opacity: 0.5 }}
          />
        ))}
```

- [ ] **Step 5: Start the dev server and verify manually**

Run: `npm run dev` (if not already running from Task 1)

Open the app in a browser and check:
1. Ferry routes appear as thin dark-blue lines on the map for the currently selected lake(s), visible under the ship/station markers.
2. Switching lakes (via the lake selector) updates the drawn routes to match the newly connected lake(s) — no leftover lines from the previous lake.
3. Toggling the base map style (Task 1's button) between OSM and Swisstopo does not remove or duplicate the route lines — they stay rendered across both styles.
4. No console errors, and no visually broken/self-intersecting lines that would indicate a `[lat, lon]` vs `[lon, lat]` mixup (compare against the known shoreline shape of the lake — routes should follow the water, not jump inland or off-map).

Expected: all checks pass.

- [ ] **Step 6: Commit**

```bash
git add components/ShipMap.tsx
git commit -m "$(cat <<'EOF'
Render ferry routes as an always-on map overlay

ShipMap already loaded per-lake GeoJSON routes for a console log;
this keeps them in state and draws them as Polylines so users can
see the ferry network, not just the live ship positions.
EOF
)"
```

---

### Task 3: Replace the toggle button with a labeled select, default to Swisstopo

**Files:**
- Modify: `components/ShipMap.tsx`

**Interfaces:**
- Consumes: the existing `mapStyle` state (from Task 1) and the `Layers`-icon-button/`toggleMapStyle` it's replacing.
- Produces: a new `handleMapStyleChange(style: 'osm' | 'swisstopo')` handler, replacing `toggleMapStyle` (no other file references `toggleMapStyle`, confirmed — it was only wired to the button this task removes).

- [ ] **Step 1: Change the default `mapStyle`**

Find the `mapStyle` state declaration:

```tsx
  const [mapStyle, setMapStyle] = useState<'osm' | 'swisstopo'>('osm')
```

Change the default to `'swisstopo'`:

```tsx
  const [mapStyle, setMapStyle] = useState<'osm' | 'swisstopo'>('swisstopo')
```

Leave the effect right below it (`localStorage.getItem('mapStyle')` → `setMapStyle(stored)`) exactly as-is — it already only overrides the default when a valid stored value exists, so no other change is needed here.

- [ ] **Step 2: Replace `toggleMapStyle` with `handleMapStyleChange`**

Find:

```tsx
  const toggleMapStyle = () => {
    const next = mapStyle === 'osm' ? 'swisstopo' : 'osm'
    setMapStyle(next)
    localStorage.setItem('mapStyle', next)
  }
```

Replace with:

```tsx
  const handleMapStyleChange = (style: 'osm' | 'swisstopo') => {
    setMapStyle(style)
    localStorage.setItem('mapStyle', style)
  }
```

- [ ] **Step 3: Replace the icon button with a labeled select**

Find the button block (rendered as a direct child of the outer `<div id="ship-map-container">`, as a sibling before `<MapContainer>`):

```tsx
      {/* Map Style Toggle - Top Right, below the zoom control */}
      <button
        onClick={toggleMapStyle}
        className="absolute top-20 right-3 z-[1000] p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title={mapStyle === 'osm' ? 'Zu Swisstopo wechseln' : 'Zu OpenStreetMap wechseln'}
      >
        <Layers size={18} className="text-gray-700 dark:text-gray-200" />
      </button>
```

Replace with:

```tsx
      {/* Map Style Selector - Top Right, below the zoom control */}
      <div className="absolute top-20 right-3 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <select
            value={mapStyle}
            onChange={(e) => handleMapStyleChange(e.target.value as 'osm' | 'swisstopo')}
            className="bg-transparent text-gray-900 dark:text-white text-sm font-semibold pl-3 pr-9 py-2 rounded-lg outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors appearance-none"
            title="Kartenansicht wählen"
          >
            <option value="osm" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">OpenStreetMap</option>
            <option value="swisstopo" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Swisstopo</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400"
          />
        </div>
      </div>
```

This mirrors the existing lake-selector desktop dropdown (same white/dark-gray card, same `ChevronDown` overlay, same `appearance-none` native `<select>` pattern) — `ChevronDown` is already imported in this file (used by the lake selector), no new icon import needed for it.

- [ ] **Step 4: Remove the now-unused `Layers` import**

Find the `lucide-react` import:

```tsx
import { Anchor, Ship as ShipIcon, Crown, ChevronDown, X, Layers } from 'lucide-react'
```

`Layers` was only used by the button removed in Step 3. Confirm (e.g. `grep -n "Layers" components/ShipMap.tsx`) that it has no other reference in the file, then remove it:

```tsx
import { Anchor, Ship as ShipIcon, Crown, ChevronDown, X } from 'lucide-react'
```

- [ ] **Step 5: Start the dev server and verify manually**

Run: `npm run dev`

Open the app in a browser (with `localStorage` cleared for the site, e.g. via DevTools Application tab or a private/incognito window) and check:
1. On first load (no stored preference), the map opens on the Swisstopo vector basemap, and the new select shows "Swisstopo" as the selected option.
2. The select is visually a dropdown (not a plain icon button), positioned top-right below the zoom control, matching the lake selector's card style (light/dark mode both look right).
3. Choosing "OpenStreetMap" from the select switches the base layer to OSM tiles; choosing "Swisstopo" switches back to the vector basemap — both directions work via the select, not just one click.
4. After switching, reload the page — the select shows and the map renders whichever style was last chosen (localStorage persistence still works).
5. No console errors, and no lingering reference to `toggleMapStyle` or the old button anywhere (`grep -n "toggleMapStyle\|Layers" components/ShipMap.tsx` should return nothing).
6. `app/route-editor/page.tsx` is unaffected.

Expected: all checks pass.

- [ ] **Step 6: Commit**

```bash
git add components/ShipMap.tsx
git commit -m "$(cat <<'EOF'
Replace map style toggle button with a labeled select

Makes it explicit which base map is active/selectable instead of
inferring it from a single icon-button click, and makes Swisstopo
the default map style on first visit instead of OpenStreetMap.
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** Vector light basemap via MapLibre bridge ✓ Task 1. Pinned `maplibre-gl` version to avoid peer-dep mismatch ✓ Task 1 Step 2 + Global Constraints. Route overlay, always visible, reuses existing load effect ✓ Task 2. Route styling distinct from route-editor's in-progress-route styling ✓ Task 2 Step 4 (`#0c274a`/weight 3/opacity 0.5 vs `#ec4899`/weight 4/opacity 0.8). Route editor page untouched ✓ Global Constraints + Task 1 Step 6.7 + Task 3 Step 5.6. Toggle replaced by labeled select ✓ Task 3 Step 3. Swisstopo default on first visit ✓ Task 3 Step 1.
- **Placeholder scan:** none — every step has literal code, literal commands, or literal manual-check instructions.
- **Type consistency:** `mapStyle` stays `'osm' | 'swisstopo'` throughout all three tasks. `handleMapStyleChange(style: 'osm' | 'swisstopo')` matches the cast used at its one call site (`e.target.value as 'osm' | 'swisstopo'`) in Task 3 Step 3. `shipRoutes` typed `ShipRouteData[]`, matching `getCachedGeoJSONRoutes`'s return type and the `route.id` / `route.coordinates` fields used in Task 2 Step 4. `SwisstopoLayer` takes no props and is used as `<SwisstopoLayer key="swisstopo" />`, consistent with its Task 1 Step 4 definition (no props declared) — Task 3 does not touch `SwisstopoLayer`.
