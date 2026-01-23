# Release Notes - Zürichsee Ship Live Tracker

## Version 1.1.0 - January 23 2026

### 🎉 New Features

**Next Departures**
- Always see the next 3 upcoming departures, even when no ships are currently active
- Countdown in minutes until departure
- Shows ship name, route, and departure time
- Smart filtering: ships already active won't appear in next departures
- Perfect for planning when the next ship arrives!

**Countdown for Ships at Station**
- Ships waiting at the station now show a countdown chip
- See exactly how many minutes until departure
- Works correctly in both Live and Simulation mode
- Orange chip for easy recognition

**Improved Ship List**
- Ships are now sorted by departure time (earliest first)
- No more alphabetical sorting - see ships in chronological order
- Easier to understand the sequence of departures

**Improved Simulation**
- Simulation now always starts at 13:32 (best time to see many ships)
- Date is always today - no more confusion with old dates
- Faster switching between Live and Simulation modes
- Countdown timers work correctly in simulation mode

**Mobile Optimization**
- Better experience on smartphones
- Live/Simulation buttons at the bottom for easier access
- Timeline slider now available on mobile
- Optimized layout for smaller screens

**User Experience**
- When no ships are active in Live mode, you can directly switch to Simulation
- Calendar icon is more visible on mobile devices
- Slider responds smoother and more fluidly

### 🔧 Improvements

**Performance**
- Data now refreshes every 6 hours (instead of 12 hours)
- Faster loading of ship positions
- Reduced lag when moving the timeline slider
- More efficient rendering of schedule panel

**Documentation**
- New user documentation directly in the app
- Available in German and English
- Explains how the app works (without technical details)

---

## Version 1.0.0 - January 22 2026

### 🚀 Initial Release

**Live Tracking**
- Real-time tracking of all ships on Lake Zurich
- Interactive map with precise ship positions
- Automatic updates every 1-2 seconds

**Simulation**
- Time-based simulation with speed control (1x to 100x)
- Timeline slider to scroll through the day
- Perfect for planning or reviewing past trips

**Ship Information**
- Display of ship names (e.g., MS Albis, MS Limmat)
- Course numbers for each trip
- Departure and arrival times
- Current route (from station → to station)

**Special Features**
- MS Albis is marked with a crown (the flagship!)
- Intelligent course number recognition (e.g., Course 29 vs. 2529)
- No duplicates - each ship is only shown once
- Precise routes based on actual shipping lanes

**Design**
- Light and dark mode (automatic or manual)
- Bilingual: German and English
- Modern, clean user interface
- Responsive design for all devices

**Technical Foundation**
- Uses public timetable data from transport.opendata.ch
- No registration or app installation required
- Works directly in your browser
- Free and ad-free
