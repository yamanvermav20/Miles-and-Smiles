import GameList from "../components/GameList";
import GameSuggester from "../components/GameSuggester";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRef, useEffect, useState } from "react";

function Home() {
  const gamesRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToGames = () => {
    gamesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-bg font-body grain">
      {/* Geometric background pattern */}
      <div className="fixed inset-0 geo-pattern pointer-events-none opacity-60" />
      <div className="fixed inset-0 geo-dots pointer-events-none opacity-30" />
      
      <div className="relative z-10">
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-[15%] w-40 h-40 rounded-full bg-gradient-to-br from-violet/20 to-violet/5 blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-1/2 right-[10%] w-28 h-28 rounded-full bg-gradient-to-br from-emerald/15 to-emerald/5 blur-3xl animate-float" style={{ animationDelay: '-1s' }} />
          <div className="absolute top-1/3 left-[5%] w-20 h-20 rounded-full bg-gradient-to-br from-amber/15 to-amber/5 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
          
          {/* Subtle moving particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-accent/30 rounded-full animate-particle"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: `${3 + i * 0.5}s`
                }}
              />
            ))}
          </div>
          
          <div className="relative max-w-5xl mx-auto px-6 text-center">
            {/* Overline tag - Slide down */}
            <div 
              className={`inline-flex items-center gap-2 mb-6 transition-all duration-700 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
            >
              <span className="tag tag-accent group hover:scale-105 transition-transform cursor-default">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="relative">
                  Play Together
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </span>
              </span>
            </div>
            
            {/* Main headline - Letter by letter feel with smooth reveal */}
            <h1 
              className={`font-display text-5xl sm:text-6xl lg:text-8xl font-semibold tracking-tight text-text mb-6 transition-all duration-1000 ease-out delay-100 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <span className="inline-block hover:scale-105 transition-transform duration-300">Miles</span>
              {" "}
              <span className="text-accent inline-block animate-pulse hover:animate-none hover:scale-125 transition-transform duration-300 cursor-default">&</span>
              {" "}
              <span className="inline-block hover:scale-105 transition-transform duration-300">Smiles</span>
            </h1>
            
            {/* Subheadline - Fade in */}
            <p 
              className={`text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-1000 ease-out delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Real-time multiplayer classics. Challenge friends to strategic battles. 
              No downloads, no waiting—just play.
            </p>
            
            {/* CTA Group - Staggered entrance */}
            <div 
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-1000 ease-out delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <button 
                onClick={scrollToGames}
                className="btn-primary text-lg px-8 py-4 group relative overflow-hidden hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Playing
                  <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
              <button 
                onClick={scrollToGames}
                className="btn-secondary text-lg px-8 py-4 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 hover:border-text-secondary"
              >
                View Games
              </button>
            </div>
            
            {/* Stats bar - Scale in with bounce */}
            <div 
              className={`inline-flex items-center gap-6 sm:gap-10 p-4 rounded-full bg-surface/80 backdrop-blur-sm border border-border shadow-lg transition-all duration-700 ease-out delay-500 hover:shadow-xl hover:border-border-strong ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              <div className="flex items-center gap-3 group cursor-default">
                <span className="text-3xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">🎮</span>
                <div className="text-left">
                  <div className="font-display text-2xl font-semibold text-text group-hover:text-accent transition-colors">4</div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">Games</div>
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-3 group cursor-default">
                <span className="text-3xl group-hover:scale-125 group-hover:-rotate-12 transition-all duration-300">👥</span>
                <div className="text-left">
                  <div className="font-display text-2xl font-semibold text-text group-hover:text-violet transition-colors">2v2</div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">Battles</div>
                </div>
              </div>
              <div className="w-px h-10 bg-border hidden sm:block" />
              <div className="hidden sm:flex items-center gap-3 group cursor-default">
                <span className="text-3xl group-hover:scale-125 transition-all duration-300 group-hover:animate-pulse">⚡</span>
                <div className="text-left">
                  <div className="font-display text-2xl font-semibold text-text group-hover:text-emerald transition-colors">Live</div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">Realtime</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Games Section */}
        <section ref={gamesRef} className="relative py-16 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            {/* Section header with reveal animation */}
            <div className="flex items-center gap-4 mb-10 group">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-text">
                Choose Your Battle
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent group-hover:from-accent/50 transition-colors duration-500" />
            </div>
            
            {/* Game List */}
            <GameList />
            
            {/* Random Pick - Below games */}
            <div className="mt-10 flex justify-center">
              <GameSuggester />
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </div>
  );
}

export default Home;
