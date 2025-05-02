
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminNews from "@/pages/admin/News";
import AdminCategories from "@/pages/admin/Categories";
import AdminUsers from "@/pages/admin/Users";
import AdminProfile from "@/pages/admin/Profile";
import UserProfile from "@/pages/UserProfile";
import NewsDetail from "@/pages/NewsDetail";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/profile" element={<UserProfile />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/news" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminNews />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/categories" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminCategories />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/profile" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminProfile />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
