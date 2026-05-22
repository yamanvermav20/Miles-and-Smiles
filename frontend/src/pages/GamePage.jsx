import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import RoomSelection from "../components/RoomSelection";
import ProtectedRoute from "../components/ProtectedRoute";

// Game component mapping
const gameComponents = {
  "tic-tac-toe": () => import("../pages/TicTacToe").then((mod) => mod.default),
  memory: () => import("../pages/Memory").then((mod) => mod.default),
  "snakes-and-ladders": () =>
    import("../pages/SnakesAndLadders").then((mod) => mod.default),
  "dots-and-boxes": () =>
    import("../pages/DotsAndBoxes").then((mod) => mod.default),
};

// Game name mapping (for display)
const gameNames = {
  "tic-tac-toe": "Tic Tac Toe",
  memory: "Memory",
  "snakes-and-ladders": "Snakes and Ladders",
  "dots-and-boxes": "Dots and Boxes",
};

const GamePage = () => {
  const { gameSlug } = useParams();
  const [roomData, setRoomData] = useState(null);
  const [GameComponent, setGameComponent] = useState(null);

  // Normalize game slug
  const normalizedSlug = gameSlug?.toLowerCase().replace(/\s+/g, "-");
  const gameName = gameNames[normalizedSlug] || gameSlug || "Game";

  // Preload game component if slug exists
  useEffect(() => {
    const gameLoader = gameComponents[normalizedSlug];
    if (gameLoader) {
      gameLoader()
        .then((Component) => {
          setGameComponent(() => Component);
        })
        .catch((error) => {
          console.error("Error loading game component:", error);
        });
    }
  }, [normalizedSlug]);

  const handleRoomJoined = ({ roomId, gameName, socket }) => {
    setRoomData({ roomId, gameName, socket });
  };

  // If room is joined, show the game component
  if (roomData && GameComponent) {
    return <GameComponent roomData={roomData} />;
  }

  // Otherwise show room selection
  return (
    <ProtectedRoute>
      <RoomSelection gameName={gameName} onRoomJoined={handleRoomJoined} />
    </ProtectedRoute>
  );
};

export default GamePage;
