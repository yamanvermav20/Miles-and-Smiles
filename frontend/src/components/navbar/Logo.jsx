export default function Logo({ username, isLoggedIn }) {
  return (
    <a
      href="/"
      title={`Welcome ${isLoggedIn && username ? username : "Guest"} 😊💕`}
      className="flex items-center gap-2 md:gap-3 group active:scale-[0.98] transition-transform"
    >
      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:shadow-accent/25 transition-all duration-300">
        <span className="text-lg group-hover:scale-110 transition-transform duration-300">🎮</span>
      </div>
      <h1 className="font-display font-semibold text-lg text-text hidden sm:block">
        Miles <span className="text-accent">&</span> Smiles
      </h1>
    </a>
  );
}
