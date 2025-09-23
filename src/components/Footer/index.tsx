import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-semibold mb-3">About</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Our mission</li>
              <li>Team</li>
              <li>Press</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Top destinations</li>
              <li>Categories</li>
              <li>Guides</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Help center</li>
              <li>Contact</li>
              <li>Accessibility</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 panel p-6 text-center">
          <h3 className="section-title text-lg mb-2">Plan your next trip with us</h3>
          <p className="text-slate-600 mb-4">Discover, plan, and save your dream itinerary.</p>
          <div className="flex items-center justify-center gap-3">
            <button className="btn btn-accent">Start Planning</button>
            <button className="btn border border-slate-300">Download App</button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-8">© {new Date().getFullYear()} LAKBAI</p>
      </div>
    </footer>
  );
};

export default Footer;


