import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppModeProvider } from "./contexts/AppModeContext";
import { BottomNav } from "./components/BottomNav";
import { VideoSplash } from "./components/VideoSplash";
import { AnnouncementPopup, AnnouncementBanner } from "./components/AnnouncementComponents";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AffiliateLogin from "./pages/AffiliateLogin";
import Cadastros from "./pages/Cadastros";
import CadastroFinalizado from "./pages/CadastroFinalizado";
import Subscribe from "./pages/Subscribe";
import AffiliateSignup from "./pages/AffiliateSignup";
import PaymentCallback from "./pages/PaymentCallback";
import Card from "./pages/Card";
import Transactions from "./pages/Transactions";
import Goals from "./pages/Goals";
import AI from "./pages/AI";
import AssistenteVoz from "./pages/AssistenteVoz";
import Planner from "./pages/Planner";
import Agenda from "./pages/Agenda";
import Rotinas from "./pages/Rotinas";
import RotinaInteligente from "./pages/RotinaInteligente";
import Statement from "./pages/Statement";
import Affiliates from "./pages/Affiliates";
import AffiliatePanel from "./pages/AffiliatePanel";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const VIDEO_SHOWN_KEY = 'inovabank_video_shown';

function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  // Hide nav on login, admin, affiliate panel, affiliate login, and landing page
  const isAffiliateRoute = location.pathname === '/afiliados' || location.pathname === '/affiliate-signup' || location.pathname === '/login/afiliados';
  const isLandingPage = location.pathname === '/lp' || location.pathname.startsWith('/lp/');
  const isOnboardingRoute = location.pathname === '/subscribe' || location.pathname === '/cadastros' || location.pathname === '/cadastro-finalizado';
  const showNav = user && location.pathname !== '/login' && location.pathname !== '/admin' && !isAffiliateRoute && !isLandingPage && !isOnboardingRoute;
  // Show announcements only for logged in users and not on admin page
  const showAnnouncements = user && location.pathname !== '/admin' && location.pathname !== '/login' && location.pathname !== '/login/afiliados' && !isLandingPage;

  return (
    <>
      {/* Announcement Popup */}
      {showAnnouncements && <AnnouncementPopup />}
      
      <Routes>
        <Route path="/lp" element={<LandingPage />} />
        <Route path="/lp/inovafinace" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/afiliados" element={<AffiliateLogin />} />
        <Route path="/cadastros" element={<Cadastros />} />
        <Route path="/cadastro-finalizado" element={<CadastroFinalizado />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/affiliate-signup" element={<AffiliateSignup />} />
        <Route path="/payment-callback" element={<PaymentCallback />} />
        <Route path="/" element={<Index />} />
        <Route path="/card" element={<Card />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/assistente" element={<AssistenteVoz />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/rotinas" element={<Rotinas />} />
        <Route path="/rotina-inteligente" element={<RotinaInteligente />} />
        <Route path="/statement" element={<Statement />} />
        <Route path="/affiliates" element={<Affiliates />} />
        <Route path="/afiliados" element={<AffiliatePanel />} />
        <Route path="/support" element={<Support />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [showVideo, setShowVideo] = useState<boolean | null>(null);

  useEffect(() => {
    // Only show video if user is NOT logged in
    // Wait for auth loading to complete before deciding
    if (!isLoading) {
      if (user) {
        // User is logged in, skip video
        setShowVideo(false);
      } else {
        // User is not logged in, show video
        setShowVideo(true);
      }
    }
  }, [user, isLoading]);

  const handleVideoComplete = () => {
    setShowVideo(false);
  };

  // Show nothing while loading auth state
  if (isLoading || showVideo === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showVideo) {
    return <VideoSplash onComplete={handleVideoComplete} />;
  }

  return <AppRoutes />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppModeProvider>
            <AppContent />
          </AppModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
