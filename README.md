# 🌟 LAKBAI Tourism Recommendation System

AI-Powered tourism route planner for Legazpi City, Philippines using BERT transformers and real user data.

## Project Overview

LAKBAI combines machine learning (BERT models) with real tourist behavior data to provide intelligent Point of Interest (POI) recommendations. The system analyzes 148 attractions in Legazpi City and learns from 312 actual user visit patterns to suggest the best next destinations for your tour.

## Architecture

### Backend (Python + Flask)
- **Flask API Server** - RESTful endpoints for frontend
- **BERT Model** - Transformer-based AI for intelligent recommendations
- **Hybrid Recommender** - Combines AI predictions with cached user patterns
- **Real User Data** - 100 users, 312 visit records, 148 POIs

### Frontend (React + TypeScript)
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast development server
- **3-Panel Interface** - POIs, Route, Recommendations

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Flask separately (if needed):**
   ```bash
   pip install flask flask-cors
   ```

4. **Start the Flask API server:**
   ```bash
   python api.py
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd lakbai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## Usage

1. **Start Backend:** Run `python api.py` in the `backend/` directory
2. **Start Frontend:** Run `npm run dev` in the `lakbai/` directory
3. **Open Browser:** Go to `http://localhost:5173`
4. **Build Your Route:**
   - Click on attractions in the left panel to add them to your route
   - View your route in the middle panel
   - Click "Get AI Recommendations" to get intelligent suggestions
   - Add recommended POIs to your route

## API Endpoints

### GET `/api/health`
Health check endpoint

### GET `/api/pois`
Get all Points of Interest

### GET `/api/pois/<id>`
Get specific POI by ID

### GET `/api/themes`
Get all available themes (Restaurant, Hotel, Park, etc.)

### POST `/api/recommend`
Get AI-powered recommendations
```json
{
  "route": [1, 5, 10],
  "count": 3
}
```

### GET `/api/stats`
Get system statistics

### GET `/api/popular-routes`
Get popular routes from user data

## Data

### POI Data (`backend/Data/POI-Legazpi.csv`)
- 148 Points of Interest
- Themes: Restaurants (42), Hotels (29), Cafes (18), Parks (12), Bars (9), etc.
- Geographic coordinates for each POI

### User Visit Data (`backend/Data/userVisits-Legazpi-allPOI.csv`)
- 100 unique users
- 100 unique visit sequences
- 312 total visit records

### User Demographics (`backend/Data/user_hometown.csv`)
- User occupation and location data
- All users from Philippines visiting Legazpi

## Features

### Smart Recommendations
- **BERT AI Predictions** - Uses transformer models to understand tourist preferences
- **Cached Patterns** - Fast lookup of popular routes
- **Real User Data** - Based on actual tourist behavior
- **Theme-Based** - Considers POI categories
- **Distance-Aware** - Factors in geographic proximity

### User Interface
- **Filter by Theme** - Show only restaurants, parks, etc.
- **Drag-Free Route Building** - Simple click to add
- **AI Recommendations** - 3 smart suggestions with reasoning
- **Responsive Design** - Works on desktop and mobile
- **Beautiful Gradients** - Modern purple theme

## Technology Stack

**Backend:**
- Python 3.11
- Flask 2.3+
- PyTorch 2.9+
- Transformers (Hugging Face)
- simpletransformers
- pandas, numpy, scikit-learn

**Frontend:**
- React 19
- TypeScript 5.8
- Vite 7.1
- CSS3 with gradients

## Development

### Running in Development

Terminal 1 (Backend):
```bash
cd backend
python api.py
```

Terminal 2 (Frontend):
```bash
cd lakbai
npm run dev
```

### Building for Production

Frontend:
```bash
cd lakbai
npm run build
```

## Project Structure

```
LAKBAI/
├── backend/
│   ├── Data/
│   │   ├── POI-Legazpi.csv
│   │   ├── userVisits-Legazpi-allPOI.csv
│   │   └── user_hometown.csv
│   ├── api.py                      # Flask API server
│   ├── hybrid_smart_recommender.py # Main recommendation engine
│   ├── BTRec_RecTour23.py          # BERT model logic
│   ├── poidata.py                  # Data processing
│   ├── Bootstrap.py                # Distance & time calculations
│   ├── config.py                   # Configuration
│   ├── common.py                   # Utility functions
│   ├── requirements.txt            # Python dependencies
│   └── smart_cache.pkl             # Pre-computed cache
├── lakbai/
│   ├── src/
│   │   ├── App.tsx                 # Main React component
│   │   ├── App.css                 # Styles
│   │   └── main.tsx                # Entry point
│   ├── package.json                # Node dependencies
│   └── vite.config.ts              # Vite configuration
└── README.md                       # This file
```

## Troubleshooting

### Backend won't start
- Make sure all Python dependencies are installed
- Check that port 5000 is not in use
- Verify Data files exist in `backend/Data/`

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check CORS is enabled (flask-cors installed)
- Verify API_BASE URL in `App.tsx`

### No recommendations showing
- Add at least one POI to your route first
- Check backend console for errors
- Verify smart_cache.pkl exists or will be generated

## Performance

- **Recommendation Speed:** ~40-50ms (with cache)
- **BERT Prediction:** ~100-500ms (real-time)
- **Data Loading:** <1 second
- **Frontend Rendering:** Instant

## Future Enhancements

- [ ] Map visualization with Leaflet/Google Maps
- [ ] Route optimization (shortest path)
- [ ] Time-based planning (hours at each POI)
- [ ] User authentication and saved routes
- [ ] POI photos and detailed descriptions
- [ ] Mobile app (React Native)
- [ ] Multi-city support
- [ ] Weather integration

## License

Educational and research use.

## Contributors

LAKBAI Tourism Recommendation System

---

**Built with ❤️ using BERT, React, and real tourist data from Legazpi City**
