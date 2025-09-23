'use client';

import React from 'react';
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-white/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl">🗺️</div>
              <span className="font-semibold">LAKBAI</span>
            </Link>
          </div>

          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search places, categories..."
                className="w-full rounded-full pl-11 pr-4 py-2 bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/saved" className="btn">
              ❤️ Saved
            </Link>
            <Link href="/profile" className="btn">
              🙂 Profile
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;


