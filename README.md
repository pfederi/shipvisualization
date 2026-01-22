# Lake Zurich Ferry Tracker

A modern web application for live visualization of ship movements on Lake Zurich. The app displays ships in real-time on an interactive map based on timetable data from ZSG (Zürichsee Schifffahrtsgesellschaft).

## 🚢 Features

- **Live Tracking**: Real-time tracking of all active ships on Lake Zurich
- **Interactive Map**: Leaflet-based map with OpenStreetMap (free, open source)
- **Simulation Mode**: Time-based simulation with speed controls (1x, 2x, 4x, 10x)
- **Ship Details**: Display of ship names, course numbers, departure and arrival times
- **Route Visualization**: Precise routes based on GeoJSON data
- **Intelligent Position Calculation**: Accounts for slower speed at arrival/departure
- **MS Albis Highlight**: Special marking for the flagship MS Albis

## 🛠️ Technology Stack

- **Next.js 15** - React Framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Open-source mapping library
- **react-leaflet** - React wrapper for Leaflet
- **lucide-react** - Modern icon library
- **transport.opendata.ch API** - Public transit timetable data
- **ZSG Ships API** - Ship names and course numbers

## 📋 Prerequisites

- Node.js 18+ and npm
- **No API keys required!** All used APIs are publicly accessible

## 🚀 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd shipvisualization
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables (optional):**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_ZSG_API_URL=https://vesseldata-api.vercel.app/api/ships
```

The `NEXT_PUBLIC_ZSG_API_URL` is optional and defaults to the VesselData API. If you want to use your own instance, you can adjust the URL here.

4. **Start the development server:**
```bash
npm run dev
```

The application will run on [http://localhost:3000](http://localhost:3000)

## 📦 Build & Deployment

### Local Build
```bash
npm run build
npm start
```

### Vercel Deployment

The project is optimized for Vercel:

1. **Vercel CLI:**
```bash
npm i -g vercel
vercel
```

2. **GitHub Integration:**
   - Push repository to GitHub
   - In Vercel Dashboard: "New Project" → Select GitHub repository
   - Vercel automatically detects Next.js and configures the project

3. **Environment Variables in Vercel:**
   - In Vercel Dashboard: Settings → Environment Variables
   - Optional: Add `NEXT_PUBLIC_ZSG_API_URL`

## 📁 Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (Proxies)
│   │   ├── ships/           # ZSG Ships API Proxy
│   │   └── stationboard/    # Transport API Proxy
│   ├── layout.tsx           # Root Layout
│   ├── page.tsx             # Main Page
│   └── globals.css          # Global Styles
├── components/              # React Components
│   ├── ShipMap.tsx         # Map Component
│   └── SchedulePanel.tsx   # Ship List & Details
├── lib/                     # Utilities and Logic
│   ├── transport-api.ts    # Transport API Client
│   ├── ship-position.ts    # Position Calculation
│   ├── ship-names-api.ts   # Ship Names API Integration
│   ├── geojson-routes.ts   # GeoJSON Route Loader
│   └── zurichsee-stations.ts # Station Coordinates
├── public/
│   └── data/
│       └── export.geojson   # Ship Routes (GeoJSON)
└── package.json
```

## 🔧 How It Works

### Route Loading

The app loads ship routes from a GeoJSON file (`public/data/export.geojson`) that contains maritime route data:

#### GeoJSON Creation

The GeoJSON file was created using **Overpass Turbo** (https://overpass-turbo.eu/), a web-based data mining tool for OpenStreetMap:

1. **Data Source**: 
   - Routes are extracted from OpenStreetMap's OpenSeaMap layer
   - OpenSeaMap contains detailed maritime navigation data including ferry routes
   - Routes are marked as `route=ferry` in OpenStreetMap

2. **Export Process**:
   - Used Overpass Turbo to query ferry routes in the Lake Zurich area
   - Query filters for routes with `route=ferry` tag within the lake boundaries
   - Exported results as GeoJSON format
   - The exported file contains `LineString` and `MultiLineString` geometries

3. **Route Properties**:
   - Each route includes metadata:
     - `name`: Route name (e.g., "3732: Personenfähre Thalwil - Küsnacht - Erlenbach")
     - `ref`: Course number reference
     - `@id`: OpenStreetMap relation/way ID
   - Coordinates are stored in GeoJSON format `[longitude, latitude]`

#### GeoJSON Processing

1. **Loading**:
   - Loads `LineString` and `MultiLineString` geometries from the file
   - Converts coordinates from `[longitude, latitude]` (GeoJSON format) to `[latitude, longitude]` (Leaflet format)
   - Extracts route metadata (name, ref, course numbers) from properties
   - Each route segment is stored with its coordinate path

2. **Route Storage**:
   - Routes are cached server-side for 24 hours using Next.js `unstable_cache`
   - Routes are loaded once on application start
   - Each route contains an array of coordinates forming the path
   - `MultiLineString` geometries are split into separate route segments

### Route Matching

When a ship travels between two stations, the app finds the best matching route from the GeoJSON data:

1. **Proximity Search**:
   - Finds the nearest point on each route to the departure station
   - Finds the nearest point on each route to the arrival station
   - Uses Haversine formula to calculate distances

2. **Scoring System**:
   - **Ideal Match**: Both stations within 500m of route endpoints (highest priority)
   - **Good Match**: Both stations within 1km of route endpoints
   - **Fallback Match**: Both stations within 5km of route endpoints
   - **Semantic Bonus**: Route name contains station names or course number
   - **Course Number Bonus**: Route metadata matches the ship's course number

3. **Route Selection**:
   - Selects route with best combined score (distance + semantic matching)
   - Automatically determines route direction (forward or reverse)
   - Extracts the segment between the matched points

4. **Fallback**:
   - If no route is found, uses linear interpolation between stations
   - This should rarely happen if GeoJSON data is complete

### Position Calculation

Ship positions are calculated based on timetable data and route geometry:

1. **Timetable Data** from `transport.opendata.ch`:
   - Departure time from origin station
   - Arrival time at destination station
   - Pass list with all intermediate stops and their times
   - Course numbers for route matching

2. **Time-Based Progress**:
   - Calculates elapsed time since departure
   - Calculates total journey duration
   - Determines progress ratio (0.0 = departure, 1.0 = arrival)

3. **Non-Linear Speed Profile**:
   The app uses a realistic speed profile that accounts for slower speeds at stations:
   
   - **Phase 1 - Departure** (first 0.5km):
     - Speed: 6 knots (11 km/h)
     - Accounts for acceleration and maneuvering
   
   - **Phase 2 - Cruising** (middle section):
     - Speed: 12 knots (22 km/h)
     - Normal travel speed
   
   - **Phase 3 - Arrival** (last 0.5km):
     - Speed: 6 knots (11 km/h)
     - Accounts for deceleration and docking
   
   The progress calculation weights these phases differently:
   - Approach phases take twice as long per kilometer as cruising
   - This creates realistic acceleration/deceleration curves

4. **Position Interpolation**:
   - If a GeoJSON route is found:
     - Calculates total route distance
     - Finds the segment where the ship currently is
     - Interpolates position along the route path
     - Calculates heading (course) based on route direction
   
   - If no route is found (fallback):
     - Uses linear interpolation between stations
     - Calculates bearing (direction) from departure to arrival

5. **Station Dwell Time**:
   - Ships are displayed at stations during dwell time
   - Dwell time is calculated from arrival to next departure
   - Ships are shown at the station location with status "at_station"
   - Prevents duplicate display when ship is in transit

### Caching

- **Server-Side Caching**: 12 hours for timetable data
- **Client-Side Caching**: 12 hours for ship names
- **Rate-Limiting**: Automatic retry logic for API limits

## 🎮 Usage

### Live Mode
- Shows current ship movements in real-time
- Automatic updates every 1-2 minutes

### Simulation Mode
- Time-based simulation with manual time control
- Speed controls: 1x, 2x, 4x, 10x
- Timeline slider to scrub through the day
- Reset button to reset

## 🔒 Security & Privacy

- **No API Keys in Code**: All used APIs are public
- **No User Data**: The app does not collect personal data
- **CORS Handling**: API proxies safely bypass CORS restrictions
- **Rate-Limiting**: Automatic limitation of API requests

## 📝 API Documentation

### External APIs

- **transport.opendata.ch**: Public transit timetable data
  - Endpoint: `/v1/stationboard`
  - Documentation: https://transport.opendata.ch/

- **ZSG Ships API**: Ship names and course numbers
  - Endpoint: `/api/ships`
  - Default URL: `https://vesseldata-api.vercel.app/api/ships`

### Internal API Routes

- `/api/ships` - Proxy for ZSG Ships API
- `/api/stationboard` - Proxy for Transport API with caching

## 🐛 Troubleshooting

### "Too Many Requests" Error
- The app uses automatic caching and retry logic
- For repeated errors: Wait a few minutes

### Ships Not Displaying
- Check browser console for errors
- Ensure APIs are reachable
- In simulation mode: Check if time is set correctly

### Map Not Loading
- Check internet connection
- OpenStreetMap tiles are publicly available, no API keys needed

## 📄 License

This project is private and not intended for public use.

## 👨‍💻 Developed by

**lakeshorestudios** - [https://lakeshorestudios.ch/](https://lakeshorestudios.ch/)

Made with AI 🤖

## 🙏 Acknowledgments

- **transport.opendata.ch** for the public timetable data
- **OpenStreetMap** for the free map tiles
- **ZSG** (Zürichsee Schifffahrtsgesellschaft) for the timetable data
