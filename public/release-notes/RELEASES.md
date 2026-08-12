
## Version 1.5.1 (August 2026)

### 🐛 Bug Fixes
- **Fixed Thielle & La Tène Placement**: "Thielle" was plotted at an unrelated bus stop in Biel (~15 km away) and "La Tène" at its train station instead of its lake pier; both now use their real ferry-stop coordinates on the canal between Bielersee and Neuenburgersee
- **Fixed Ghost Ships in the Canal**: A missing station name mapping ("Thielle-Wavre") caused ships on the Neuchâtel–Biel/Bienne course to fall back to a straight-line position instead of following the real canal route

---

## Version 1.5.0 (August 2026)

### 🌊 New Lakes & Routes
- **Bodensee**: Full station network added, including the SBS main line (Kreuzlingen–Rorschach–Bregenz–Lindau) and the URh line along the Untersee and Rhine (Kreuzlingen–Konstanz–Stein am Rhein–Schaffhausen)
- **Lac Léman**: Full station network added, covering both the Swiss and French shores (renamed from "Genfersee")
- **Lago Maggiore**: Swiss-shore station network added (Locarno, Ascona, Brissago, Gambarogno)
- **Lago di Lugano**: Full station network added, including the Italian harbors Ponte Tresa (Italia) and Porto Ceresio (renamed from "Luganersee")
- **Zugersee, Hallwilersee, Ägerisee**: Now available in the lake selector
- **Rhein Schaffhausen** and **Aare Solothurn**: New focused map views for the Rhine stretch near Schaffhausen and the Aare stretch between Biel/Bienne and Solothurn

### 🐛 Bug Fixes
- **Fixed Bielersee Aare Stations**: Corrected badly misplaced station coordinates (Büren was off by ~12 km) and restored missing ships on the Biel–Solothurn course caused by unmapped station name variants and a missing stop (Port)
- **Fixed Hallwilersee Ships**: Corrected a station name mapping bug that would have prevented any ship from being tracked
- **Fixed "Luganerseee" Typo**: Corrected the lake name display

### ⚡ Performance
- **Faster Swisstopo Loading**: Added connection preconnect hints and split the MapLibre GL library into its own chunk so it only loads when the Swisstopo map style is actually used

---

## Version 1.4.0 (August 2026)

### 🗺️ Swisstopo Map Style
- **Map Style Switcher**: New button next to the zoom controls lets you switch the map between OpenStreetMap and the official Swisstopo map
- **Swisstopo as Default**: The Swisstopo map is now shown by default for new visitors
- **Ferry Routes on Swisstopo**: When Swisstopo is active, the ferry routes are shown as a subtle dashed overlay on the map
- **Automatic Fallback**: If the Swisstopo map can't be loaded, the app automatically falls back to OpenStreetMap

---

## Version 1.3.0 (January 2026)

### 🗺️ Multi-Lake Support
- **Multiple Lakes**: Support for multiple Swiss lakes (currently available: Zürichsee, Vierwaldstättersee, Thunersee, Brienzersee, Walensee)
- **Lake Selection**: Easy lake selection via dropdown/button above the map (top left)
- **Zoom Controls**: Moved zoom controls to top right for better accessibility

### 🚉 Station Departures
- **Station View**: Click on any station marker to view all departures from that station
- **Real-time Departures**: See upcoming and past departures with accurate times
- **Round Trip Display**: For round trips, shows intermediate stations instead of just the end destination
- **Station Details**: View course numbers, destinations, and departure times for each ship

### 📱 Mobile Enhancements
- **Mobile Lake Selection**: Beautiful bottom sheet modal for lake selection on mobile devices
- **Improved Mobile Layout**: Lake selection moved from header to map overlay for better UX
- **Better Readability**: Large, touch-friendly buttons in mobile lake selection modal

### 🐛 Bug Fixes
- **Fixed Hallwilersee Stations**: Corrected station coordinates and names for Hallwilersee
- **Fixed Round Trip Destinations**: Now shows intermediate stations instead of just the end destination for round trips
- **Fixed Station Coordinates**: Corrected swapped coordinates for Boniswil and Meisterschwanden Delphin

---

## Version 1.2.0 (January 2026)

### 🎨 UI/UX Improvements
- **Smaller Harbor Icons**: Station markers (anchors) are now 50% smaller for a cleaner map view
- **Golden MS Albis**: The flagship MS Albis now has a distinctive golden ship icon instead of a crown
- **Improved Ship Icons**: Ships now have a blue circle background with white border for better visibility
- **Date Warning in Panel**: Added warning banner in schedule panel when date is more than 5 days in the future
- **Cleaner Ship Names**: Removed course number from ship name when no real name is available (shown separately in chip)

### ⚡ Performance & Reliability
- **Improved Route Matching**: Better tolerance (800m) for station-to-route matching
- **Wädenswil Fix**: Fixed issue where some departures from Wädenswil were not displayed
- **Parallel Position Calculation**: All ship positions now calculated in parallel for better performance
- **Smarter Deduplication**: Improved logic to prevent duplicate ships from appearing
- **Better Cache Management**: Empty results are no longer cached, preventing stale data
- **Force Refresh**: Manual refresh button to bypass all caches

### 🚢 Ship Movement
- **Faster Acceleration**: Ships now accelerate/decelerate more realistically
- **Shorter Approach Distance**: Reduced from 500m to 250m for more dynamic movement
- **Quadratic Speed Curves**: More realistic speed profiles during departure and arrival

### 🎮 Simulation Mode
- **Live Timeline Updates**: Ship positions update in real-time while dragging the timeline slider
- **Persistent Time**: Timeline stays at selected time when released (doesn't jump back)
- **Date Selection**: Added date picker back to simulation controls
- **Next Departures**: Preview of upcoming departures in schedule panel

### 🐛 Bug Fixes
- **Fixed Hydration Errors**: Resolved React hydration mismatches in theme system
- **Fixed Station Name Normalization**: Better handling of station name variants
- **Fixed Duplicate Station Bug**: Correctly handles API bug where stations appear multiple times in route
- **Fixed Course Number Normalization**: Consistent handling of course numbers with leading zeros
- **Fixed Herrliberg UIC**: Corrected duplicate UIC reference

### 🔧 Technical Improvements
- **Reusable Footer Component**: Footer extracted into separate component
- **Improved Type Safety**: Better TypeScript types throughout the codebase
- **Better Error Handling**: More robust error handling and logging
- **Debug Logging**: Comprehensive logging for troubleshooting

---

## Version 1.1.0 (January 2026)

### 📱 Mobile Enhancements
- **Full Mobile Support**: Complete responsive design for phones and tablets
- **Mobile Bottom Bar**: Live/Simulation toggle and simulation controls at the bottom
- **Sliding Ship Panel**: Full-screen sliding panel for ship details on mobile
- **Mobile Loading Indicator**: Centered loading spinner when data is being fetched
- **Date Selection on Mobile**: Added date picker to mobile simulation controls
- **Safe Area Support**: Proper handling of notches and home indicators on modern devices

### 🌓 Dark Mode
- **Full Dark Mode Support**: Complete dark theme for all components
- **Theme Toggle**: Easy switching between light and dark mode in header
- **Persistent Theme**: Theme preference saved in browser storage
- **Optimized Colors**: Improved text contrast and readability in dark mode

### 🌍 Internationalization
- **Bilingual Support**: Full German and English translations
- **Language Toggle**: Easy language switching in header
- **Browser Detection**: Automatic language detection on first visit
- **Persistent Language**: Language preference saved in browser storage

---

## Version 1.0.0 (January 2026)

### 🎉 Initial Release
- **Live Ship Tracking**: Real-time visualization of ships on Lake Zurich
- **Interactive Map**: Leaflet-based map with OpenStreetMap tiles
- **Simulation Mode**: Time-based simulation with speed controls (1x, 2x, 4x, 10x)
- **Ship Details**: Display of ship names, course numbers, departure and arrival times
- **Route Visualization**: Precise routes based on GeoJSON data from OpenSeaMap
- **Intelligent Position Calculation**: Non-linear speed profiles for realistic movement
- **MS Albis Highlight**: Special marking for the flagship MS Albis
- **Schedule Panel**: List of active ships with detailed information
- **GeoJSON Route Matching**: Smart algorithm to match timetable data with maritime routes
- **Ship Names API**: Integration with ZSG Ships API for accurate ship names
- **Caching**: Server-side and client-side caching for optimal performance
