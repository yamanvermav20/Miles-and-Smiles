import { useNavigate } from "react-router-dom";

export default function AuthButtons({
  isLoggedIn,
  handleLogout,
  handleLogin,
  mobileVisible = false,
}) {
  const navigate = useNavigate();
  const visibility = mobileVisible ? "block md:hidden" : "hidden md:block";

  return isLoggedIn ? (
    <button
      onClick={handleLogout}
      className={`${visibility} btn-ghost text-accent hover:bg-accent-soft active:scale-95 transition-all duration-200`}
    >
      Logout
    </button>
  ) : (
    <button
      onClick={handleLogin || (() => navigate("/auth"))}
      className={`${visibility} btn-primary py-2 px-5 text-sm active:scale-95`}
    >
      Sign In
    </button>
  );
}
