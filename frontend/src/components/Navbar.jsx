import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSearch } from "../context/SearchContext.jsx";
import SearchBar from "./navbar/SearchBar.jsx";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "./navbar/Logo.jsx";
import Friends from "./navbar/Friends.jsx";
import Favourites from "./navbar/Favourites.jsx";
import ThemeToggle from "./navbar/ThemeToggle.jsx";
import Profile from "./navbar/Profile.jsx";
import AuthButtons from "./navbar/AuthButtons.jsx";
import MobileMenu from "./navbar/MobileMenu.jsx";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { setQuery } = useSearch();

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // fix: actually navigate when login is requested
  const handleLogin = () => navigate("/auth");
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <Logo username={user?.username} isLoggedIn={isAuthenticated} />

        <SearchBar onChange={(value) => setQuery(value)} />

        <div className="flex items-center gap-2 md:gap-3">
          <Friends />
          <Favourites isLoggedIn={isAuthenticated} />
          <ThemeToggle />
          {isAuthenticated && <Profile user={user} />}
          <AuthButtons
            isLoggedIn={isAuthenticated}
            handleLogout={handleLogout}
            handleLogin={handleLogin}
          />
          <button
            onClick={toggleMenu}
            className="md:hidden p-2.5 hover:bg-accent-soft text-text-secondary hover:text-accent rounded-xl transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <MobileMenu
        isLoggedIn={isAuthenticated}
        handleLogout={handleLogout}
        handleLogin={handleLogin}
        menuOpen={menuOpen}
        user={user}
        onSearch={(value) => setQuery(value)}
      />
    </nav>
  );
};

export default Navbar;
