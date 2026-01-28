
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
