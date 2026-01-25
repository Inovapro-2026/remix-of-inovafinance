import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';

const Index = () => {
  const { user, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const refreshedOnceRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // No user logged in - redirect to login
        navigate('/login');
        return;
      }

      // ✅ CRITICAL: Check if onboarding is completed
      // If not completed, redirect to subscribe to finish registration
      if (!user.onboardingCompleted) {
        // Guard against stale profile immediately after signup/update.
        if (!refreshedOnceRef.current) {
          refreshedOnceRef.current = true;
          refreshUser();
          return;
        }

        navigate('/subscribe?trial=true');
        return;
      }

      // ✅ Check if account is blocked
      if (user.blocked || user.planType === 'blocked') {
        // User is blocked - they'll see the blocked modal in Dashboard
        // Allow them to see Dashboard with the modal
      }
    }
  }, [user, isLoading, navigate, refreshUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;
