import SearchBar from "./SearchBar.jsx";
import Friends from "./Friends.jsx";
import Profile from "./Profile.jsx";
import Favourites from "./Favourites.jsx";
import AuthButtons from "./AuthButtons.jsx";

export default function MobileMenu({
  isLoggedIn,      // standardized prop name
  handleLogout,
  handleLogin,
  menuOpen,
  user,
  onSearch, // 👈 new
}) {
  if (!menuOpen) return null;

  return (
    <div className="absolute top-full left-0 w-full flex justify-center z-50 md:hidden">
      <div className="w-[calc(100%-2rem)] max-w-sm bg-(--surface) border border-(--muted) rounded-lg shadow-lg p-3 flex flex-col items-center space-y-3">
        <SearchBar mobileVisible onChange={onSearch} />
        <div className="flex w-full justify-between items-center">
          {isLoggedIn && user && <Profile user={user} mobileVisible />}
          <Friends mobileVisible />
          <Favourites mobileVisible />
          <AuthButtons
            isLoggedIn={isLoggedIn}
            handleLogout={handleLogout}
            handleLogin={handleLogin}
            mobileVisible
          />
        </div>
      </div>
    </div>
  );
}
