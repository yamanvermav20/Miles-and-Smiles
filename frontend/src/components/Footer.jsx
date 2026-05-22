/**
 * Footer Component
 * Bold, confident footer with distinct visual identity
 */

import { Github, Twitter, Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-surface border-t border-border">
      {/* Subtle pattern */}
      <div className="absolute inset-0 geo-dots opacity-20 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎮</span>
              <span className="font-display text-xl font-semibold text-text">
                Miles <span className="text-accent">&</span> Smiles
              </span>
            </div>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Real-time multiplayer classics. No downloads, just pure gaming joy with friends.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-bg-deep flex items-center justify-center text-text-muted hover:bg-accent-soft hover:text-accent transition-colors"
              >
                <Github size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-bg-deep flex items-center justify-center text-text-muted hover:bg-violet-soft hover:text-violet transition-colors"
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Games Section */}
          <div>
            <h4 className="font-display font-semibold text-text mb-4">Games</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/games/tic-tac-toe" className="text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-accent rounded-full transition-all duration-200" />
                  Tic Tac Toe
                </a>
              </li>
              <li>
                <a href="/games/memory" className="text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-accent rounded-full transition-all duration-200" />
                  Memory Match
                </a>
              </li>
              <li>
                <a href="/games/snakes-and-ladders" className="text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-accent rounded-full transition-all duration-200" />
                  Snakes & Ladders
                </a>
              </li>
              <li>
                <a href="/games/dots-and-boxes" className="text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-accent rounded-full transition-all duration-200" />
                  Dots & Boxes
                </a>
              </li>
            </ul>
          </div>

          {/* Features Section */}
          <div>
            <h4 className="font-display font-semibold text-text mb-4">Features</h4>
            <ul className="space-y-3 text-sm">
              <li className="text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                Real-time Multiplayer
              </li>
              <li className="text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet" />
                In-game Chat
              </li>
              <li className="text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                Friend System
              </li>
              <li className="text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Save Favorites
              </li>
            </ul>
          </div>

          {/* Quick Links Section */}
          <div>
            <h4 className="font-display font-semibold text-text mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/" className="text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-accent rounded-full transition-all duration-200" />
                  Home
                </a>
              </li>
              <li>
                <a href="/profile" className="text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-accent rounded-full transition-all duration-200" />
                  Profile
                </a>
              </li>
              <li>
                <a href="/auth" className="text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1 group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-accent rounded-full transition-all duration-200" />
                  Sign In
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <p>© {currentYear} Miles & Smiles. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart size={14} className="text-accent fill-accent" /> for gamers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
