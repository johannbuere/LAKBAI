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

interface Stats {
  total_pois: number
  total_users: number
  total_visits: number
  cache_size: number
}

function App() {
  const [pois, setPois] = useState<POI[]>([])
  const [currentRoute, setCurrentRoute] = useState<number[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [themes, setThemes] = useState<string[]>([])
  const [themeCounts, setThemeCounts] = useState<Record<string, number>>({})
  const [selectedTheme, setSelectedTheme] = useState<string>('All')
  const [error, setError] = useState<string>('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')

  // Fetch all POIs on component mount
  useEffect(() => {
    fetchPOIs()
    fetchThemes()
    fetchStats()
  }, [])

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

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
      setThemeCounts(data.counts || {})
    } catch (err) {
      console.error('Failed to fetch themes:', err)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`)
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
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
      const poi = getPOIById(poiId)
      setCurrentRoute([...currentRoute, poiId])
      setRecommendations([]) // Clear recommendations when route changes
      if (poi) {
        setSuccessMessage(`Added "${poi.fullName || poi.name}" to your route`)
        setError('') // Clear any errors
      }
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
        <div className="header-content">
          <h1>🌟 LAKBAI Tourism Planner</h1>
          <p className="header-subtitle">
            AI-Powered Route Recommendations for Legazpi City
            <span className="badge">BERT AI</span>
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.total_pois}</span>
            <span className="stat-label">POIs</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.total_users}</span>
            <span className="stat-label">Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.total_visits}</span>
            <span className="stat-label">Visits</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.cache_size}</span>
            <span className="stat-label">Cached Routes</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          ✓ {successMessage}
        </div>
      )}

      {/* Error Message */}
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
            <label htmlFor="theme-select">Filter by Theme:</label>
            <select
              id="theme-select"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="theme-select"
            >
              {themes.map(theme => (
                <option key={theme} value={theme}>
                  {theme === 'All'
                    ? `All (${pois.length})`
                    : `${theme} (${themeCounts[theme] || 0})`
                  }
                </option>
              ))}
            </select>
          </div>

          <div className="pois-list">
            {pois.length === 0 ? (
              <div className="empty-state">
                <p className="empty-message">
                  No attractions loaded yet.
                </p>
                <p className="empty-hint">
                  Make sure the backend server is running on port 5000
                </p>
              </div>
            ) : filteredPOIs.length === 0 ? (
              <div className="empty-state">
                <p className="empty-message">
                  No {selectedTheme} attractions found
                </p>
                <p className="empty-hint">
                  Try selecting a different theme
                </p>
              </div>
            ) : (
              filteredPOIs.map(poi => (
                <div
                  key={poi.id}
                  className={`poi-card ${currentRoute.includes(poi.id) ? 'selected' : ''}`}
                  onClick={() => addToRoute(poi.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      addToRoute(poi.id)
                    }
                  }}
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
              <div className="empty-state">
                <p className="empty-message">Your route is empty</p>
                <p className="empty-hint">
                  Click on attractions from the left panel to build your route
                </p>
              </div>
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
                      aria-label={`Remove ${poi.fullName || poi.name} from route`}
                      title="Remove from route"
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
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing with BERT AI...
                </>
              ) : (
                '🤖 Get AI Recommendations'
              )}
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
            {loading ? (
              <div className="loading-state">
                <div className="spinner large"></div>
                <p className="loading-message">Analyzing your route with BERT AI...</p>
                <p className="loading-hint">This may take a few seconds</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="empty-state">
                <p className="empty-message">No recommendations yet</p>
                <p className="empty-hint">
                  {currentRoute.length === 0
                    ? 'Add attractions to your route, then click "Get AI Recommendations"'
                    : 'Click the "Get AI Recommendations" button to see personalized suggestions'
                  }
                </p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div key={rec.poi_id} className="recommendation-card">
                  <div className="rec-header">
                    <span className="rec-rank">#{index + 1}</span>
                    <span className="rec-score">
                      {(rec.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <h3>{rec.name}</h3>
                  <span className="rec-theme">{rec.theme}</span>
                  <p className="rec-reason">{rec.reason}</p>
                  <button
                    className="btn btn-add"
                    onClick={() => addToRoute(rec.poi_id)}
                    disabled={currentRoute.includes(rec.poi_id)}
                  >
                    {currentRoute.includes(rec.poi_id) ? '✓ Already in Route' : '+ Add to Route'}
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
