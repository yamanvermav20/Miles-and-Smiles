import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  // Load theme from localStorage or match system preference
  const [isDark, setIsDark] = useState(() => {
    if (localStorage.getItem("theme")) {
      return localStorage.getItem("theme") === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggleTheme = () => setIsDark((prev) => !prev);

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // Notify others (like if GameList wants to adjust colors)
    window.dispatchEvent(
      new CustomEvent("themeChange", { detail: isDark ? "dark" : "light" })
    );
  }, [isDark]);

  // Sync if user changes theme in another tab
  useEffect(() => {
    const handleStorageChange = () => {
      setIsDark(localStorage.getItem("theme") === "dark");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl hover:bg-amber-soft transition-all duration-200 active:scale-95"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="text-amber" size={20} />
      ) : (
        <Moon className="text-text-muted hover:text-violet transition-colors" size={20} />
      )}
    </button>
  );
}
