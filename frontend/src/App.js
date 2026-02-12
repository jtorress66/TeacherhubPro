import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import axios from "axios";

// Contexts
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SchoolProvider } from "./contexts/SchoolContext";

// Pages
import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import PlannerList from "./pages/PlannerList";
import LessonPlanner from "./pages/LessonPlanner";
import Templates from "./pages/Templates";
import Attendance from "./pages/Attendance";
import AttendanceReports from "./pages/AttendanceReports";
import Gradebook from "./pages/Gradebook";
import Classes from "./pages/Classes";
import Settings from "./pages/Settings";
import SubstitutePacket from "./pages/SubstitutePacket";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import AdminPanel from "./pages/AdminPanel";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Protected Route component with subscription check
const ProtectedRoute = ({ children, requireSubscription = true }) => {
  const { user, loading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Skip if user came from AuthCallback
    if (location.state?.user) {
      setIsChecking(false);
      return;
    }

    const verify = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    verify();
  }, [checkAuth, location.state]);

  // Check subscription status after user is verified
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !requireSubscription) {
        setSubLoading(false);
        return;
      }
      
      try {
        const res = await axios.get(`${API}/subscription/status`, { withCredentials: true });
        setSubscriptionStatus(res.data);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus({ has_access: false, status: 'none' });
      } finally {
        setSubLoading(false);
      }
    };
    
    if (user) {
      checkSubscription();
    }
  }, [user, requireSubscription]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center paper-bg">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check subscription access (only if requireSubscription is true)
  if (requireSubscription && !subLoading && subscriptionStatus && !subscriptionStatus.has_access) {
    // Redirect to pricing page if trial expired or no subscription
    return <Navigate to="/pricing" state={{ trialExpired: subscriptionStatus.status === 'trial_expired' }} replace />;
  }

  // Still loading subscription status
  if (requireSubscription && subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center paper-bg">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return children;
};

// App Router component to handle session_id detection
const AppRouter = () => {
  const location = useLocation();

  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/planner" element={
        <ProtectedRoute><PlannerList /></ProtectedRoute>
      } />
      <Route path="/planner/new" element={
        <ProtectedRoute><LessonPlanner /></ProtectedRoute>
      } />
      <Route path="/planner/:planId" element={
        <ProtectedRoute><LessonPlanner /></ProtectedRoute>
      } />
      <Route path="/templates" element={
        <ProtectedRoute><Templates /></ProtectedRoute>
      } />
      <Route path="/attendance" element={
        <ProtectedRoute><Attendance /></ProtectedRoute>
      } />
      <Route path="/attendance/reports" element={
        <ProtectedRoute><AttendanceReports /></ProtectedRoute>
      } />
      <Route path="/gradebook" element={
        <ProtectedRoute><Gradebook /></ProtectedRoute>
      } />
      <Route path="/classes" element={
        <ProtectedRoute><Classes /></ProtectedRoute>
      } />
      <Route path="/classes/:classId" element={
        <ProtectedRoute><Classes /></ProtectedRoute>
      } />
      <Route path="/substitute-packet" element={
        <ProtectedRoute><SubstitutePacket /></ProtectedRoute>
      } />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/subscription/success" element={
        <ProtectedRoute requireSubscription={false}><SubscriptionSuccess /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute requireSubscription={false}><Settings /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requireSubscription={false}><AdminPanel /></ProtectedRoute>
      } />
      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SchoolProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <AppRouter />
          </BrowserRouter>
        </SchoolProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
