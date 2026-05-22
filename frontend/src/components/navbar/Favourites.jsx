import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Favourites({ mobileVisible = false }) {
  const navigate = useNavigate();

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(
    () => localStorage.getItem("showFavoritesOnly") === "true"
  );

  const { isAuthenticated } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(!!isAuthenticated);

  useEffect(() => {
    setIsLoggedIn(!!isAuthenticated);
  }, [isAuthenticated]);

  const handleFavoritesToggle = () => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    const newState = !showFavoritesOnly;
    setShowFavoritesOnly(newState);
    localStorage.setItem("showFavoritesOnly", newState.toString());
    window.dispatchEvent(
      new CustomEvent("favoritesFilterChange", { detail: newState })
    );
  };

  const visibility = mobileVisible ? "flex md:hidden" : "hidden md:flex";

  return (
    <div className={`${visibility} items-center`}>
      <button
        onClick={handleFavoritesToggle}
        className="p-2.5 rounded-xl transition-all duration-200 active:scale-95 hover:bg-accent-soft"
        title={
          showFavoritesOnly ? "Show all games" : "Show favorite games only"
        }
      >
        <Heart
          className={`${
            showFavoritesOnly 
              ? "fill-red-500 text-red-500" 
              : "text-text-muted hover:text-red-500"
          } transition-colors duration-200`}
          size={mobileVisible ? 18 : 20}
        />
      </button>
    </div>
  );
}
