import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Auth from "../pages/Auth.jsx";
import GamePage from "../pages/GamePage.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import Chess from "../pages/Chess.jsx";

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/games/:gameSlug"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chess"
          element={
            <ProtectedRoute>
              <Chess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chess/:roomId"
          element={
            <ProtectedRoute>
              <Chess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default AppRouter;