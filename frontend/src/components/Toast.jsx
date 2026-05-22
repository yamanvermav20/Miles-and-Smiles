export default function Toast({ type = "success", message }) {
  return (
    <div
      className={`fixed top-4 right-4 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-medium z-50 border
        animate-[slideIn_0.3s_ease-out]
      ${type === "success" 
        ? "bg-emerald-soft text-emerald border-emerald/20 shadow-emerald/10" 
        : "bg-accent-soft text-accent border-accent/20 shadow-accent/10"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${type === "success" ? "bg-emerald/20" : "bg-accent/20"}`}>
          {type === "success" ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        {message}
      </div>
    </div>
  );
}
