import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import axiosClient from "../axiosClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import GameHistoryModal from "./GameHistoryModal.jsx";

const GameCard = ({ image, title }) => {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { isAuthenticated, token, user, updateUser } = useAuth();

  // Fetch user's favorite games if logged in
  const fetchFavorites = async () => {
    try {
      if (!token) return;
      const response = await axiosClient.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const favoriteGames = response.data.favouriteGames || [];
      setIsFavorited(favoriteGames.includes(title));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  // Check if user is logged in and fetch favorites
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setIsFavorited(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, isAuthenticated, token]);

  const handleClick = () => {
    // If authenticated, show history modal first
    if (isAuthenticated) {
      setShowHistoryModal(true);
    } else {
      // If not authenticated, go directly to game
      navigateToGame();
    }
  };

  const navigateToGame = () => {
    // Chess has its own dedicated route
    if (title.toLowerCase() === "chess") {
      navigate("/chess");
    } else {
      const path = "/games/" + title.toLowerCase().replace(/\s+/g, "-");
      navigate(path);
    }
  };

  const handlePlayFromModal = () => {
    setShowHistoryModal(false);
    navigateToGame();
  };

  const handleStarClick = async (e) => {
    e.stopPropagation(); // Prevent card click navigation

    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    try {
      const response = await axiosClient.post(
        "/api/user/favorites",
        { gameTitle: title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const favs = response.data.favouriteGames || [];
      setIsFavorited(favs.includes(title));
      // Update user in context if available
      if (user) {
        updateUser({ favouriteGames: favs });
      }

      // Dispatch event to notify GameList that favorites were updated
      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // If error is due to authentication, navigate to auth page
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/auth");
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-2xl bg-surface border border-border overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-300"
    >
      {/* Image Container - Compact */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-bg-deep">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1714]/90 via-[#1A1714]/20 to-transparent" />
        
        {/* Play Button - compact, subtle */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-accent/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-all duration-300">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        
        {/* Title overlay on image */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-white truncate drop-shadow-lg">
              {title}
            </h2>
            <button
              onClick={handleStarClick}
              className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 cursor-pointer ${
                isFavorited 
                  ? "bg-amber text-amber shadow-lg shadow-amber/30 hover:bg-amber/80" 
                  : "bg-black/40 backdrop-blur-sm text-white/70 hover:bg-black/60 hover:text-white"
              }`}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={`${
                  isFavorited
                    ? "fill-yellow-300 text-yellow-300"
                    : ""
                } transition-colors duration-200`}
                size={16}
              />
            </button>
          </div>
        </div>
        
        {/* Favorite Badge - Top left corner */}
        {isFavorited && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-amber text-[10px] font-bold text-white uppercase tracking-wide flex items-center gap-1 shadow-lg">
            <Star size={10} className="fill-current" />
            Favorite
          </div>
        )}
      </div>

      {/* Game History Modal */}
      <GameHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        gameName={title}
        onPlay={handlePlayFromModal}
      />
    </div>
  );
};

export default GameCard;
