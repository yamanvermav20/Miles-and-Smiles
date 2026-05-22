import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // or a spinner/skeleton
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
