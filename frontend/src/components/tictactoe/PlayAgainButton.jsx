/**
 * Play Again Button Component
 * Button to reset and start a new game
 */

/**
 * @param {Object} props
 * @param {Function} props.onClick - Click handler function
 * @param {string} props.variant - Button variant ("win" or "draw")
 */
function PlayAgainButton({ onClick, variant = "win" }) {
  const baseClasses =
    "px-6 py-3 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg";
  const variantClasses =
    variant === "win"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-gray-600 hover:bg-gray-700";

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses}`}>
      Play Again
    </button>
  );
}

export default PlayAgainButton;
