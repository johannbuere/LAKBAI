import { useState, useEffect } from 'react'
import './App.css'

// API Base URL - change to backend URL
const API_BASE = 'http://localhost:5000/api'

interface POI {
  id: number
  name: string
  fullName?: string
  theme: string
  latitude: number
  longitude: number
}

interface Recommendation {
  poi_id: number
  name: string
  theme: string
  score: number
  reason: string
}

function App() {
  const [pois, setPois] = useState<POI[]>([])
  const [currentRoute, setCurrentRoute] = useState<number[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [themes, setThemes] = useState<string[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('All')
  const [error, setError] = useState<string>('')

  // Fetch all POIs on component mount
  useEffect(() => {
    fetchPOIs()
    fetchThemes()
  }, [])

  // Fetch all POIs
  const fetchPOIs = async () => {
    try {
      const response = await fetch(`${API_BASE}/pois`)
      const data = await response.json()
      setPois(data.pois || [])
    } catch (err) {
      setError('Failed to fetch POIs. Make sure the backend server is running.')
      console.error(err)
    }
  }

  // Fetch themes
  const fetchThemes = async () => {
    try {
      const response = await fetch(`${API_BASE}/themes`)
      const data = await response.json()
      setThemes(['All', ...(data.themes || [])])
    } catch (err) {
      console.error('Failed to fetch themes:', err)
    }
  }

  // Get recommendations
  const getRecommendations = async () => {
    if (currentRoute.length === 0) {
      setError('Please add at least one POI to your route first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: currentRoute, count: 3 })
      })

      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError('Failed to get recommendations. Make sure the backend server is running.')
      console.error(err)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  // Add POI to route
  const addToRoute = (poiId: number) => {
    if (!currentRoute.includes(poiId)) {
      setCurrentRoute([...currentRoute, poiId])
      setRecommendations([]) // Clear recommendations when route changes
    }
  }

  // Remove POI from route
  const removeFromRoute = (poiId: number) => {
    setCurrentRoute(currentRoute.filter(id => id !== poiId))
    setRecommendations([]) // Clear recommendations when route changes
  }

  // Clear route
  const clearRoute = () => {
    setCurrentRoute([])
    setRecommendations([])
  }

  // Get POI by ID
  const getPOIById = (id: number): POI | undefined => {
    return pois.find(poi => poi.id === id)
  }

  // Filter POIs by theme
  const filteredPOIs = selectedTheme === 'All'
    ? pois
    : pois.filter(poi => poi.theme === selectedTheme)

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🌟 LAKBAI Tourism Planner</h1>
        <p>AI-Powered Route Recommendations for Legazpi City</p>
      </header>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="main-content">
        {/* Left Panel - POI List */}
        <div className="panel pois-panel">
          <h2>Available Attractions</h2>

          <div className="theme-filter">
            <label>Filter by Theme:</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
            >
              {themes.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>

          <div className="pois-list">
            {filteredPOIs.length === 0 ? (
              <p>No POIs available. Please start the backend server.</p>
            ) : (
              filteredPOIs.map(poi => (
                <div
                  key={poi.id}
                  className={`poi-card ${currentRoute.includes(poi.id) ? 'selected' : ''}`}
                  onClick={() => addToRoute(poi.id)}
                >
                  <h3>{poi.fullName || poi.name}</h3>
                  <span className="poi-theme">{poi.theme}</span>
                  {currentRoute.includes(poi.id) && (
                    <span className="poi-badge">✓ In Route</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle Panel - Current Route */}
        <div className="panel route-panel">
          <h2>Your Route ({currentRoute.length} stops)</h2>

          <div className="route-list">
            {currentRoute.length === 0 ? (
              <p className="empty-message">Click on attractions to add them to your route</p>
            ) : (
              currentRoute.map((poiId, index) => {
                const poi = getPOIById(poiId)
                return poi ? (
                  <div key={poiId} className="route-item">
                    <span className="route-number">{index + 1}</span>
                    <div className="route-details">
                      <h4>{poi.fullName || poi.name}</h4>
                      <span className="route-theme">{poi.theme}</span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromRoute(poiId)}
                    >
                      ✕
                    </button>
                  </div>
                ) : null
              })
            )}
          </div>

          <div className="route-actions">
            <button
              className="btn btn-primary"
              onClick={getRecommendations}
              disabled={loading || currentRoute.length === 0}
            >
              {loading ? 'Getting Recommendations...' : '🤖 Get AI Recommendations'}
            </button>
            {currentRoute.length > 0 && (
              <button className="btn btn-secondary" onClick={clearRoute}>
                Clear Route
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Recommendations */}
        <div className="panel recommendations-panel">
          <h2>AI Recommendations</h2>

          <div className="recommendations-list">
            {recommendations.length === 0 ? (
              <p className="empty-message">
                {loading ? 'Loading...' : 'Click "Get AI Recommendations" to see suggestions'}
              </p>
            ) : (
              recommendations.map((rec, index) => (
                <div key={rec.poi_id} className="recommendation-card">
                  <div className="rec-header">
                    <span className="rec-rank">#{index + 1}</span>
                    <span className="rec-score">Score: {(rec.score * 100).toFixed(1)}%</span>
                  </div>
                  <h3>{rec.name}</h3>
                  <span className="rec-theme">{rec.theme}</span>
                  <p className="rec-reason">{rec.reason}</p>
                  <button
                    className="btn btn-add"
                    onClick={() => addToRoute(rec.poi_id)}
                    disabled={currentRoute.includes(rec.poi_id)}
                  >
                    {currentRoute.includes(rec.poi_id) ? 'Already in Route' : 'Add to Route'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
