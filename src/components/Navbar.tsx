'use client';

import React from 'react';
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold">🗺️</div>
              <span className="text-xl font-bold">LAKBAI</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              <Link 
                href="/" 
                className="hover:text-primary-200 transition-colors duration-200"
              >
                Home
              </Link>
              <Link 
                href="/explore" 
                className="hover:text-primary-200 transition-colors duration-200"
              >
                Explore
              </Link>
              <Link 
                href="/plan" 
                className="hover:text-primary-200 transition-colors duration-200"
              >
                Plan Route
              </Link>
              <Link 
                href="/recommendations" 
                className="hover:text-primary-200 transition-colors duration-200"
              >
                Recommendations
              </Link>
              <Link 
                href="/offline" 
                className="hover:text-primary-200 transition-colors duration-200"
              >
                Offline Routes
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-white hover:text-primary-200 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
