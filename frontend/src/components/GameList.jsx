import { useEffect, useState, useCallback, useMemo } from "react";
import GameCard from "./GameCard";
import axiosClient from "../axiosClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSearch } from "../context/SearchContext.jsx";

const GameList = () => {
  const [allGames, setAllGames] = useState([]);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(
    () => localStorage.getItem("showFavoritesOnly") === "true"
  );
  const { isAuthenticated, token } = useAuth();
  const { query } = useSearch();

  // Fetch all games (from MongoDB)
  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await axiosClient.get(`/api/games`);
        setAllGames(res.data);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    }

    fetchGames();
  }, []);

  // Fetch user favorites if logged in
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setFavoriteGames([]);
      return;
    }

    try {
      const response = await axiosClient.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const favoriteGameTitles = response.data.favouriteGames || [];
      setFavoriteGames(favoriteGameTitles);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavoriteGames([]);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Handle favorites toggling and sync across app
  useEffect(() => {
    const handleFavoritesFilterChange = async (e) => {
      setShowFavoritesOnly(e.detail);
      if (e.detail && isAuthenticated) {
        fetchFavorites();
      }
    };

    const handleFavoritesUpdate = async () => {
      if (isAuthenticated) {
        fetchFavorites();
      }
    };

    window.addEventListener(
      "favoritesFilterChange",
      handleFavoritesFilterChange
    );
    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);

    return () => {
      window.removeEventListener(
        "favoritesFilterChange",
        handleFavoritesFilterChange
      );
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
    };
  }, [isAuthenticated, fetchFavorites]);

  // Compute final displayed games (favorites + search filtering)
  const displayedGames = useMemo(() => {
    let gamesToShow = allGames;

    // Filter by favorites if enabled
    if (showFavoritesOnly && isAuthenticated) {
      gamesToShow = gamesToShow.filter((game) =>
        favoriteGames.includes(game.title)
      );
    }

    // Real-time search filter (case-insensitive, startsWith)
    if (query.trim()) {
      const lower = query.toLowerCase();
      gamesToShow = gamesToShow.filter(
        (game) => game.title && game.title.toLowerCase().startsWith(lower)
      );
    }

    return gamesToShow;
  }, [allGames, favoriteGames, showFavoritesOnly, isAuthenticated, query]);

  // Render
  return (
    <div className="w-full">
      {/* Games Grid - Full width layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedGames.length > 0 &&
          displayedGames.map((game, i) => (
            <div 
              key={game._id || i} 
              className="animate-fadeIn"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <GameCard image={game.image} title={game.title} />
            </div>
          ))
        }
      </div>
      
      {/* Empty States */}
      {displayedGames.length === 0 && showFavoritesOnly && query.trim() && isAuthenticated && (
        <div className="text-center py-16 animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber/20 flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">
            No matching favorites
          </h3>
          <p className="text-text-muted">
            No favorite games match "{query}". Try a different search.
          </p>
        </div>
      )}
      
      {displayedGames.length === 0 && showFavoritesOnly && !query.trim() && isAuthenticated && (
        <div className="text-center py-16 animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet/20 flex items-center justify-center">
            <span className="text-4xl">⭐</span>
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">
            No favorites yet
          </h3>
          <p className="text-text-muted">
            Click the star on any game to add it to your favorites!
          </p>
        </div>
      )}
      
      {displayedGames.length === 0 && !showFavoritesOnly && query.trim() && (
        <div className="text-center py-16 animate-fadeIn">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-deep flex items-center justify-center">
            <span className="text-4xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">
            No games found
          </h3>
          <p className="text-text-muted">
            No games starting with "{query}". Try a different search.
          </p>
        </div>
      )}
    </div>
  );
};

export default GameList;
