import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({
  onChange,
  className = "",
  mobileVisible = false,
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleInput = (e) => {
    const value = e.target.value;
    setQuery(value);
    onChange?.(value);
  };

  return (
    <div
      className={`${mobileVisible ? "flex md:hidden" : "hidden md:flex"} 
                  items-center bg-bg-deep border border-border rounded-xl
                  ${mobileVisible ? "px-3 py-2" : "px-4 py-2.5"} 
                  ${mobileVisible ? "w-full" : "w-[40%] max-w-md"} 
                  transition-all duration-200 ${className}
                  ${isFocused ? "border-accent shadow-sm" : "hover:border-border-strong"}`}
    >
      <Search
        className={`mr-2 transition-colors ${isFocused ? "text-accent" : "text-text-muted"}`}
        size={mobileVisible ? 16 : 18}
      />
      <input
        type="text"
        placeholder="Search games..."
        value={query}
        onChange={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="bg-transparent outline-none text-text placeholder-text-muted w-full text-sm"
      />
    </div>
  );
}
