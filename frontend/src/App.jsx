import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddApplication from "./pages/AddApplication";
import ApplicationDetail from "./pages/ApplicationDetail";
import Navbar from "./components/Navbar";
import VerifyEmail from "./pages/VerifyEmail";
import KanbanBoard from "./pages/KanbanBoard";
import ResumeList from "./pages/ResumeList";
import ResumeEditor from "./pages/ResumeEditor";

// Protect routes — redirect to login if not logged in
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navbar />
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/add"
          element={
            <PrivateRoute>
              <Navbar />
              <AddApplication />
            </PrivateRoute>
          }
        />
        <Route
          path="/application/:id"
          element={
            <PrivateRoute>
              <Navbar />
              <ApplicationDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/board"
          element={
            <PrivateRoute>
              <Navbar />
              <KanbanBoard />
            </PrivateRoute>
          }
        />
        <Route
          path="/resumes"
          element={
            <PrivateRoute>
              <Navbar />
              <ResumeList />
            </PrivateRoute>
          }
        />
        <Route
          path="/resumes/:id"
          element={
            <PrivateRoute>
              <Navbar />
              <ResumeEditor />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}