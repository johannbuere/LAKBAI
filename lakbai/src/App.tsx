import { useState, useEffect } from 'react'
import './App.css'
import { IoSparkles, IoClose, IoCheckmark, IoWarning } from 'react-icons/io5'
import { HiSparkles } from 'react-icons/hi2'
import { TbRobot } from 'react-icons/tb'
import { motion, AnimatePresence } from 'framer-motion'

// API Base URL - change to backend URL
const API_BASE = 'http://localhost:5000/api'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const headerVariants = {
  hidden: { y: -50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
}

const statsBarVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
      damping: 15,
      staggerChildren: 0.1
    }
  }
}

const statItemVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 20 }
  }
}

const messageVariants = {
  initial: { y: -20, opacity: 0, scale: 0.95 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 }
  },
  exit: {
    y: -20,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
}

const panelVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 150,
      damping: 20
    }
  },
  hover: {
    scale: 1.02,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
  },
  tap: { scale: 0.98 }
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 150, damping: 20 }
  }
}

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: { type: 'spring' as const, stiffness: 400, damping: 15 }
  },
  tap: { scale: 0.95 }
}

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
    <motion.div
      className="app-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.header
        className="app-header"
        variants={headerVariants}
      >
        <div className="header-content">
          <h1>
            <HiSparkles className="header-icon" />
            LAKBAI Tourism Planner
          </h1>
          <p className="header-subtitle">
            AI-Powered Route Recommendations for Legazpi City
            <span className="badge">BERT AI</span>
          </p>
        </div>
      </motion.header>

      {/* Stats Bar */}
      <AnimatePresence>
        {stats && (
          <motion.div
            className="stats-bar"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            variants={statsBarVariants}
          >
            <motion.div className="stat-item" variants={statItemVariants}>
              <span className="stat-value">{stats.total_pois}</span>
              <span className="stat-label">POIs</span>
            </motion.div>
            <motion.div className="stat-item" variants={statItemVariants}>
              <span className="stat-value">{stats.total_users}</span>
              <span className="stat-label">Users</span>
            </motion.div>
            <motion.div className="stat-item" variants={statItemVariants}>
              <span className="stat-value">{stats.total_visits}</span>
              <span className="stat-label">Visits</span>
            </motion.div>
            <motion.div className="stat-item" variants={statItemVariants}>
              <span className="stat-value">{stats.cache_size}</span>
              <span className="stat-label">Cached Routes</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            className="success-message"
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <IoCheckmark className="message-icon" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-message"
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <IoWarning className="message-icon" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="main-content" variants={containerVariants}>
        {/* Left Panel - POI List */}
        <motion.div className="panel pois-panel" variants={panelVariants}>
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

          <motion.div
            className="pois-list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {pois.length === 0 ? (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <p className="empty-message">
                  No attractions loaded yet.
                </p>
                <p className="empty-hint">
                  Make sure the backend server is running on port 5000
                </p>
              </motion.div>
            ) : filteredPOIs.length === 0 ? (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <p className="empty-message">
                  No {selectedTheme} attractions found
                </p>
                <p className="empty-hint">
                  Try selecting a different theme
                </p>
              </motion.div>
            ) : (
              filteredPOIs.map(poi => (
                <motion.div
                  key={poi.id}
                  className={`poi-card ${currentRoute.includes(poi.id) ? 'selected' : ''}`}
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap="tap"
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
                  <AnimatePresence>
                    {currentRoute.includes(poi.id) && (
                      <motion.span
                        className="poi-badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <IoCheckmark /> In Route
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.div>

        {/* Middle Panel - Current Route */}
        <motion.div className="panel route-panel" variants={panelVariants}>
          <h2>Your Route ({currentRoute.length} stops)</h2>

          <motion.div
            className="route-list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {currentRoute.length === 0 ? (
                <motion.div
                  className="empty-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring' }}
                >
                  <p className="empty-message">Your route is empty</p>
                  <p className="empty-hint">
                    Click on attractions from the left panel to build your route
                  </p>
                </motion.div>
              ) : (
                currentRoute.map((poiId, index) => {
                  const poi = getPOIById(poiId)
                  return poi ? (
                    <motion.div
                      key={poiId}
                      className="route-item"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ x: -100, opacity: 0 }}
                      layout
                      transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                    >
                      <span className="route-number">{index + 1}</span>
                      <div className="route-details">
                        <h4>{poi.fullName || poi.name}</h4>
                        <span className="route-theme">{poi.theme}</span>
                      </div>
                      <motion.button
                        className="remove-btn"
                        onClick={() => removeFromRoute(poiId)}
                        aria-label={`Remove ${poi.fullName || poi.name} from route`}
                        title="Remove from route"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <IoClose />
                      </motion.button>
                    </motion.div>
                  ) : null
                })
              )}
            </AnimatePresence>
          </motion.div>

          <div className="route-actions">
            <motion.button
              className="btn btn-primary"
              onClick={getRecommendations}
              disabled={loading || currentRoute.length === 0}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              {loading ? (
                <>
                  <motion.span
                    className="spinner"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                  Analyzing with BERT AI...
                </>
              ) : (
                <>
                  <TbRobot className="btn-icon" />
                  Get AI Recommendations
                </>
              )}
            </motion.button>
            <AnimatePresence>
              {currentRoute.length > 0 && (
                <motion.button
                  className="btn btn-secondary"
                  onClick={clearRoute}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  Clear Route
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Panel - Recommendations */}
        <motion.div className="panel recommendations-panel" variants={panelVariants}>
          <h2>AI Recommendations</h2>

          <motion.div
            className="recommendations-list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  className="loading-state"
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring' }}
                >
                  <motion.div
                    className="spinner large"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                  <p className="loading-message">Analyzing your route with BERT AI...</p>
                  <p className="loading-hint">This may take a few seconds</p>
                </motion.div>
              ) : recommendations.length === 0 ? (
                <motion.div
                  className="empty-state"
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring' }}
                >
                  <p className="empty-message">No recommendations yet</p>
                  <p className="empty-hint">
                    {currentRoute.length === 0
                      ? 'Add attractions to your route, then click "Get AI Recommendations"'
                      : 'Click the "Get AI Recommendations" button to see personalized suggestions'
                    }
                  </p>
                </motion.div>
              ) : (
                <motion.div key="recommendations" variants={listVariants}>
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={rec.poi_id}
                      className="recommendation-card"
                      variants={cardVariants}
                      whileHover="hover"
                      custom={index}
                    >
                      <div className="rec-header">
                        <span className="rec-rank">#{index + 1}</span>
                        <span className="rec-score">
                          {(rec.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <h3>{rec.name}</h3>
                      <span className="rec-theme">{rec.theme}</span>
                      <p className="rec-reason">{rec.reason}</p>
                      <motion.button
                        className="btn btn-add"
                        onClick={() => addToRoute(rec.poi_id)}
                        disabled={currentRoute.includes(rec.poi_id)}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        {currentRoute.includes(rec.poi_id) ? (
                          <>
                            <IoCheckmark className="btn-icon" />
                            Already in Route
                          </>
                        ) : (
                          <>
                            <IoSparkles className="btn-icon" />
                            Add to Route
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default App
