import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import AuthModal from "../components/AuthModal";
import lakbaiIcon from "../assets/lakbai.svg";

export default function Index() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleAuthSuccess = (userData: any) => {
    // Auth context will handle the user state
    navigate("/home");
  };

  const handleSignOut = () => {
    signOut();
  };

  const openSignIn = () => {
    setAuthMode("signin");
    setAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthMode("signup");
    setAuthModalOpen(true);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSwitchMode={switchAuthMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-lakbai-green rounded-lg p-1.5 flex items-center justify-center">
              <img src={lakbaiIcon} alt="Lakbai" className="w-full h-full" />
            </div>
            <span className="text-2xl font-bold text-lakbai-green">lakbai</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-lakbai-green-bg/30 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <a href="#" className="px-6 py-2 text-lakbai-green-dark font-medium hover:text-lakbai-green transition-colors">
              Home
            </a>
            <a href="#" className="px-6 py-2 text-lakbai-gray-text font-medium hover:text-lakbai-green transition-colors">
              About
            </a>
            <a href="#" className="px-6 py-2 text-lakbai-gray-text font-medium hover:text-lakbai-green transition-colors">
              How it Works
            </a>
            <a href="#" className="px-6 py-2 text-lakbai-gray-text font-medium hover:text-lakbai-green transition-colors">
              Contact
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/home")}
                  className="text-lakbai-gray-text font-medium hover:text-lakbai-green transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openSignIn}
                  className="text-lakbai-gray-text font-medium hover:text-lakbai-green transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className="px-6 py-2.5 bg-lakbai-green text-white font-semibold rounded-full hover:bg-lakbai-green-dark transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-100px)] flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            Plan your trip,
            <br />
            <span className="text-lakbai-green">Smart</span> and
            <br />
            <span className="text-lakbai-green">Personalized</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto">
            Discover places, build routes, and explore Legazpi
            <br />
            with your own AI-powered travel companion
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => user ? navigate("/map") : openSignUp()}
              className="px-8 py-4 bg-lakbai-lime text-gray-900 text-lg font-semibold rounded-full hover:bg-lakbai-green-light transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              {user ? "Go to Map" : "Test our demo"}
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
            <div className="px-4 py-2 bg-lakbai-green-dark/10 text-lakbai-green-dark text-sm font-medium rounded-full">
              v0.1.0
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-lakbai-green-dark mb-4">
            Why Choose Lakbai?
          </h2>
          <p className="text-xl text-center text-lakbai-gray-text mb-16 max-w-2xl mx-auto">
            Experience travel planning like never before with intelligent recommendations and seamless navigation.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-lakbai-green-bg rounded-3xl p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-lakbai-green rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-lakbai-green-dark mb-3">
                AI-Powered Recommendations
              </h3>
              <p className="text-lakbai-gray-text">
                Get personalized destination suggestions based on your preferences and travel style.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-lakbai-green-bg rounded-3xl p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-lakbai-green rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-lakbai-green-dark mb-3">
                Smart Route Optimization
              </h3>
              <p className="text-lakbai-gray-text">
                Optimize your journey with the best routes for car, bike, or walking.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-lakbai-green-bg rounded-3xl p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-lakbai-green rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-lakbai-green-dark mb-3">
                Real-Time Planning
              </h3>
              <p className="text-lakbai-gray-text">
                Plan your itinerary in real-time with accurate travel times and distances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-lakbai-gray py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-lakbai-green-dark mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-lakbai-green text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-lakbai-green-dark mb-3">
                Choose Your Destination
              </h3>
              <p className="text-lakbai-gray-text">
                Select from our curated list of amazing destinations or search for your dream location.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-lakbai-green text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-lakbai-green-dark mb-3">
                Get AI Recommendations
              </h3>
              <p className="text-lakbai-gray-text">
                Our intelligent system suggests the best places to visit based on your interests.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-lakbai-green text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-lakbai-green-dark mb-3">
                Explore Your Journey
              </h3>
              <p className="text-lakbai-gray-text">
                View your optimized itinerary on an interactive map and start your adventure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-lakbai-green to-lakbai-green-light py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of travelers who trust Lakbai for their adventures.
          </p>
          <button
            onClick={() => user ? navigate("/map") : openSignUp()}
            className="px-10 py-5 bg-white text-lakbai-green-dark text-xl font-semibold rounded-full hover:bg-lakbai-lime transition-all transform hover:scale-105 shadow-2xl"
          >
            {user ? "Plan Your Trip Now" : "Get Started Free"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-lakbai-green-dark py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={lakbaiIcon} alt="Lakbai" className="w-10 h-10" />
              <span className="text-xl font-bold text-white">lakbai</span>
            </div>
            <p className="text-white/80 text-center">
              © 2025 Lakbai. Your smart travel companion.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                Contact
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
