import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import UserRoute from "@/components/UserRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Detect from "./pages/Detect";
import HistoryPage from "./pages/History";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUniqueVisitorsList from "./pages/AdminUniqueVisitorsList";
import AdminVisitsList from "./pages/AdminVisitsList";
import AdminPremiumUsersList from "./pages/AdminPremiumUsersList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
            <Route path="/detect" element={<UserRoute><Detect /></UserRoute>} />
            <Route path="/history" element={<UserRoute><HistoryPage /></UserRoute>} />
            <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
            <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin-visitors" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin-unique-visitors" element={<AdminRoute><AdminUniqueVisitorsList /></AdminRoute>} />
            <Route path="/admin-total-visits" element={<AdminRoute><AdminVisitsList /></AdminRoute>} />
            <Route path="/admin-premium-users" element={<AdminRoute><AdminPremiumUsersList /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
