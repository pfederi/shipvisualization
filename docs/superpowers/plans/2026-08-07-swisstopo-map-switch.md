# Swisstopo Map Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toggle on the main ship map that switches the base layer between OpenStreetMap and Swisstopo's `pixelkarte-farbe`, persisted across reloads.

**Architecture:** Add `mapStyle` state to `components/ShipMap.tsx`, initialized from and synced to `localStorage`. Replace the single hardcoded `<TileLayer>` with a `key`-forced remount driven by `mapStyle`, choosing between two URL/attribution configs. Add a small icon-button overlay (styled like `ThemeLanguageToggle.tsx`) that flips `mapStyle`.

**Tech Stack:** Next.js (App Router) + React + TypeScript, `react-leaflet` v5 / `leaflet` v1.9, Tailwind CSS, `lucide-react` icons.

## Global Constraints

- Scope is `components/ShipMap.tsx` only. Do not touch `app/route-editor/page.tsx`.
- Only two base layers: OpenStreetMap (existing) and Swisstopo `ch.swisstopo.pixelkarte-farbe` (new). No satellite/aerial layer, no dropdown — a single two-state toggle button.
- Swisstopo tile URL (public, no API key): `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg`. Attribution: `&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>`.
- Persist the chosen style in `localStorage` under key `mapStyle` with values `'osm' | 'swisstopo'`, same pattern as the existing theme/language toggle.
- **No test framework is configured in this repo** (no Jest/Vitest/RTL — confirmed via `package.json` scripts and repo search). Do not introduce one for this task. Verification is manual: run the dev server, use the browser and DevTools (Network tab for tile requests, Application tab for `localStorage`).
- Follow existing code style in `ShipMap.tsx`: Tailwind utility classes, `lucide-react` icons, overlay controls positioned `absolute ... z-[1000]` as siblings of `MapContainer`.

---

### Task 1: Map style toggle (state, tile switching, UI)

**Files:**
- Modify: `components/ShipMap.tsx`

**Interfaces:**
- Consumes: nothing new from outside this file.
- Produces: nothing consumed by other files — this is a self-contained, single-file change.

- [ ] **Step 1: Add the `Layers` icon import**

In `components/ShipMap.tsx:6`, extend the existing `lucide-react` import:

```tsx
import { Anchor, Ship as ShipIcon, Crown, ChevronDown, X, Layers } from 'lucide-react'
```

- [ ] **Step 2: Add `mapStyle` state and localStorage read-on-mount**

In `components/ShipMap.tsx`, after the existing `isMobile` state block (currently lines 42-50, the `useEffect` with `checkMobile`), add:

```tsx
const [mapStyle, setMapStyle] = useState<'osm' | 'swisstopo'>('osm')
useEffect(() => {
  const stored = localStorage.getItem('mapStyle')
  if (stored === 'osm' || stored === 'swisstopo') {
    setMapStyle(stored)
  }
}, [])
```

- [ ] **Step 3: Add the toggle handler**

In the same file, near `handleLakeSelect` (currently lines 142-147), add a sibling function:

```tsx
const toggleMapStyle = () => {
  const next = mapStyle === 'osm' ? 'swisstopo' : 'osm'
  setMapStyle(next)
  localStorage.setItem('mapStyle', next)
}
```

- [ ] **Step 4: Compute the tile config for the active style**

Directly above the `return (` in the component body (right after Step 3's handler), add:

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

- [ ] **Step 5: Replace the hardcoded `TileLayer` with the config-driven one**

In `components/ShipMap.tsx:242-245`, replace:

```tsx
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
```

with:

```tsx
        <TileLayer
          key={mapStyle}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />
```

- [ ] **Step 6: Add the toggle button overlay**

In `components/ShipMap.tsx`, immediately after the closing `)}` of the lake-selection block (currently ends at line 232, right before `<MapContainer`), add a new sibling element:

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

This sits below the Leaflet zoom control (which occupies the top-right corner at roughly `top: 10px`, ~70px tall for its two buttons), so `top-20` (80px) avoids overlap.

- [ ] **Step 7: Start the dev server and verify manually**

Run: `npm run dev`

Open the app in a browser at the printed local URL (default `http://localhost:3000`), and check:
1. The map loads with OpenStreetMap tiles by default (as before).
2. A new small square button with a layers icon appears top-right, below the `+`/`-` zoom buttons, not overlapping the lake selector (top-left) or the zoom control.
3. Clicking the button swaps the visible tiles to the Swisstopo Landeskarte (color, labeled in German/French/Italian depending on region) — confirm in DevTools Network tab that requests now go to `wmts.geo.admin.ch/.../pixelkarte-farbe/...`.
4. Clicking again swaps back to OSM tiles (`tile.openstreetmap.org`).
5. In DevTools Application tab, confirm `localStorage` key `mapStyle` updates to `"swisstopo"` / `"osm"` on each click.
6. Reload the page while `mapStyle` is `"swisstopo"` in `localStorage` — confirm the map opens directly on Swisstopo tiles (no flash of OSM first).
7. Confirm `app/route-editor/page.tsx` is unaffected (still OSM + OpenSeaMap overlay, no new button).

Expected: all checks pass. If tiles don't switch, check the DevTools console for CORS/network errors on the `wmts.geo.admin.ch` request before debugging further.

- [ ] **Step 8: Commit**

```bash
git add components/ShipMap.tsx
git commit -m "$(cat <<'EOF'
Add OSM/Swisstopo base map toggle to ShipMap

Lets users switch the main ship map between OpenStreetMap and
Swisstopo's pixelkarte-farbe base layer, persisted in localStorage.
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** Scope (ShipMap only) ✓ Step 1-6/8. Swisstopo layer + URL ✓ Step 4. UI icon button styled like `ThemeLanguageToggle` ✓ Step 6. Persistence via localStorage ✓ Steps 2-3. Route editor untouched ✓ Step 7.7 explicitly checks this. No satellite layer / no dropdown ✓ only two-state ternary, no `<select>` added.
- **Placeholder scan:** none — every step has literal code or literal manual-check instructions.
- **Type consistency:** `mapStyle` typed `'osm' | 'swisstopo'` consistently in `useState`, the `localStorage` read guard, and `toggleMapStyle`; `tileConfig` fields `url`/`attribution` match the props passed to `TileLayer` in Step 5.
