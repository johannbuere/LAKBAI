# LAKBAI 🗺️

**AI-Powered Tourist Navigation and Recommendation System for Legazpi City**

LAKBAI is an intelligent tourism platform that combines modern web technologies with AI-driven recommendations to help tourists discover and navigate Legazpi City, Philippines. The system provides real-time navigation, personalized recommendations, and offline route storage capabilities.

## ✨ Features

- 🤖 **AI-Powered Recommendations** - Smart POI suggestions based on user location and preferences
- 🗺️ **Interactive Maps** - Real-time mapping with Leaflet and OpenStreetMap
- 🚗 **Multi-Modal Routing** - Support for driving, cycling, and walking routes via OSRM
- 📱 **Offline Capability** - Store routes locally for offline access
- 🎯 **Location-Based Services** - GPS integration for accurate positioning
- 🏛️ **Rich POI Database** - Comprehensive database of Legazpi City attractions
- 📊 **Real-time Analytics** - Track usage and optimize recommendations

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Leaflet** - Interactive maps
- **Axios** - HTTP client
- **LocalForage** - Offline data storage

### Backend
- **FastAPI** - High-performance Python web framework
- **Pydantic** - Data validation
- **OSRM** - Open Source Routing Machine
- **Docker** - Containerized routing services

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/johannbuere/LAKBAI.git
cd LAKBAI
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will be available at [http://localhost:3000](http://localhost:3000)

### 3. Backend Setup

**🚀 Quick Start (Windows):**
```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Alternative Methods:**

**Windows Script:**
```bash
cd backend
start.bat
```

**Linux/macOS Script:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

**Full Manual Setup:**
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at [http://localhost:8000](http://localhost:8000)
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📁 Project Structure

```
lakbai/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── MapView.tsx      # Interactive map component
│   │   ├── Navbar.tsx       # Navigation bar
│   │   └── ...
│   └── lib/                 # Utilities and services
│       └── api.ts           # API service layer
├── backend/
│   ├── main.py             # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── start.bat          # Windows startup script
│   └── start.sh           # Linux/macOS startup script
├── public/                 # Static assets
└── package.json           # Node.js dependencies
```

## 🗺️ API Endpoints

### Core Endpoints
- `GET /` - Health check
- `GET /pois` - Get all Points of Interest
- `POST /recommend` - Get AI-powered recommendations
- `GET /route` - Calculate routes between points
- `GET /health` - Detailed system health check

### Example Usage
```javascript
// Get recommendations
const response = await fetch('http://localhost:8000/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lat: 13.142, lon: 123.735 })
});

// Get route
const route = await fetch(
  'http://localhost:8000/route?start_lat=13.142&start_lon=123.735&end_lat=13.136&end_lon=123.746'
);
```

## 🏛️ Points of Interest

Current POI database includes:
- **Legazpi Cathedral** - Historic religious site
- **Cagsawa Ruins** - Iconic historical landmark
- **Mayon Volcano Viewpoint** - Scenic volcano views
- **Embarcadero de Legazpi** - Waterfront promenade
- **Albay Park and Wildlife** - Family-friendly nature park

## 🔧 Configuration

### Environment Variables
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAP_CENTER_LAT=13.142
NEXT_PUBLIC_MAP_CENTER_LON=123.735
OSRM_HOST=localhost
OSRM_PORT=5000
```

## 🐳 OSRM Setup (Optional)

For full routing capabilities, set up OSRM with Docker:

```bash
# The project includes pre-configured OSRM data for Legazpi
cd backend/osrm-docker

# Start OSRM server for different transport modes
docker run -t -i -p 5000:5000 -v $(pwd)/car:/data osrm/osrm-backend osrm-routed --algorithm mld /data/legazpi.osrm
```

## 📱 Usage Examples

### Basic Navigation
1. Open LAKBAI in your browser
2. Allow location access for GPS positioning
3. Click "Get AI Recommendations" for personalized suggestions
4. Explore the interactive map with POI markers
5. Click on any POI to view details

### Route Planning
1. Navigate to the Plan Route section
2. Set your starting point and destination
3. Choose transportation mode (driving/cycling/walking)
4. Save routes for offline access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Roadmap

### Phase 1 (Current)
- [x] Basic frontend with Next.js
- [x] FastAPI backend setup
- [x] Interactive map integration
- [x] Basic POI database
- [x] Simple recommendation system

### Phase 2 (Planned)
- [ ] Enhanced AI recommendation model
- [ ] User authentication and profiles
- [ ] Review and rating system
- [ ] Advanced search and filters
- [ ] Mobile app development

### Phase 3 (Future)
- [ ] Real-time traffic integration
- [ ] Social features and sharing
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Business partnerships integration

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Contact: johannbuere@gmail.com
=


## 🙏 Acknowledgments

- OpenStreetMap contributors for map data
- OSRM project for routing capabilities
- Next.js and FastAPI communities

---


