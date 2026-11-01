import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-ivory/80 pt-20 pb-12 border-t border-border-midnight relative overflow-hidden">
      {/* Subtle cartographic grid background */}
      <div className="absolute inset-0 bg-cartography-dark pointer-events-none opacity-40" />

      {/* Ambient warm glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Editorial Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          
          {/* Brand & Philosophy */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-gold border border-gold/30">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Smart<span className="text-gold font-serif italic font-normal">Travel</span>
              </span>
            </Link>

            <p className="text-xs font-mono tracking-cartographic uppercase text-gold">
              The Atlas of Elsewhere
            </p>

            <p className="text-sm leading-relaxed text-ivory/70 max-w-sm font-normal">
              Travel is not just about reaching a destination. It is about discovering places, people, and stories that change how you see the world.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-gold-foil/80">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Go where the story takes you.</span>
            </div>
          </div>

          {/* Navigation Atlas */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-[11px] font-mono uppercase tracking-cartographic text-gold font-semibold">
              The Atlas
            </h4>
            <ul className="space-y-2.5 text-xs uppercase tracking-loose-editorial font-medium">
              <li>
                <Link to="/" className="text-ivory/70 hover:text-white transition-colors flex items-center gap-1.5">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-ivory/70 hover:text-white transition-colors flex items-center gap-1.5">
                  Discover Chapters
                </Link>
              </li>
              <li>
                <Link to="/plan-trip" className="text-ivory/70 hover:text-white transition-colors flex items-center gap-1.5">
                  Compose Journey
                </Link>
              </li>
              <li>
                <Link to="/my-trips" className="text-ivory/70 hover:text-white transition-colors flex items-center gap-1.5">
                  My Saved Atlas
                </Link>
              </li>
            </ul>
          </div>

          {/* Curated Geographies */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-[11px] font-mono uppercase tracking-cartographic text-gold font-semibold">
              Coordinates
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-ivory/70">
              <Link to="/explore?category=Heritage" className="hover:text-white transition-colors flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold/70" /> 24°N Rajasthan
              </Link>
              <Link to="/explore?category=Nature" className="hover:text-white transition-colors flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold/70" /> 09°N Kerala Waters
              </Link>
              <Link to="/explore?category=Mountains" className="hover:text-white transition-colors flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold/70" /> 32°N Pir Panjal
              </Link>
              <Link to="/explore?category=Beach" className="hover:text-white transition-colors flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold/70" /> 15°N Arabian Sea
              </Link>
              <Link to="/explore?category=Spiritual" className="hover:text-white transition-colors flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold/70" /> 30°N Ganges Gorge
              </Link>
              <Link to="/explore?category=Adventure" className="hover:text-white transition-colors flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold/70" /> 34°N High Ladakh
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Dynamic Year and Honest Scope */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ivory/50">
          <p className="font-mono text-[11px]">
            &copy; {currentYear} SmartTravel. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-[11px] font-mono tracking-wider uppercase">
            <Link to="/explore" className="hover:text-ivory/80 transition-colors">
              Explore
            </Link>
            <Link to="/plan-trip" className="hover:text-ivory/80 transition-colors">
              Plan
            </Link>
            <Link to="/login" className="hover:text-ivory/80 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-ivory/80 transition-colors">
              Register
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
