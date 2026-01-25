import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

export type SubscriptionStatusType = {
  isFreeTrial: boolean;
  isPaid: boolean;
  isBlocked: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean; // 24h before expiration
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  planType: 'none' | 'free_trial' | 'paid' | 'blocked';
  timeRemainingText: string;
};

export function useSubscriptionStatus() {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatusType>({
    isFreeTrial: false,
    isPaid: false,
    isBlocked: false,
    isExpired: false,
    isExpiringSoon: false,
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    trialEndsAt: null,
    subscriptionEndsAt: null,
    planType: 'none',
    timeRemainingText: '',
  });
  
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user?.userId) return;

    const now = new Date();
    const planType = user.planType || 'none';
    const trialEndsAt = user.trialExpiresAt || user.subscriptionEndDate || null;
    const subscriptionEndsAt = user.subscriptionExpiresAt || null;
    
    // Calculate time remaining for trial
    let daysRemaining = 0;
    let hoursRemaining = 0;
    let minutesRemaining = 0;
    let timeRemainingText = '';
    
    const endDate = planType === 'paid' ? subscriptionEndsAt : trialEndsAt;
    
    if (endDate) {
      daysRemaining = Math.max(0, differenceInDays(endDate, now));
      hoursRemaining = Math.max(0, differenceInHours(endDate, now) % 24);
      minutesRemaining = Math.max(0, differenceInMinutes(endDate, now) % 60);
      
      if (daysRemaining > 0) {
        timeRemainingText = `${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} e ${hoursRemaining}h restantes`;
      } else if (hoursRemaining > 0) {
        timeRemainingText = `${hoursRemaining}h ${minutesRemaining}min restantes`;
      } else if (minutesRemaining > 0) {
        timeRemainingText = `${minutesRemaining} minutos restantes`;
      } else {
        timeRemainingText = 'Expirado';
      }
    }

    const isFreeTrial = planType === 'free_trial' && user.subscriptionStatus !== 'active';
    const isPaid = planType === 'paid' || user.subscriptionStatus === 'active';
    const isBlocked = planType === 'blocked' || user.blocked;
    
    // Check if trial has expired
    const isExpired = isFreeTrial && trialEndsAt && now > trialEndsAt;
    
    // Check if expiring in 24 hours (show renewal modal)
    const isExpiringSoon = isFreeTrial && trialEndsAt && !isExpired && 
      differenceInHours(trialEndsAt, now) <= 24;

    setStatus({
      isFreeTrial,
      isPaid,
      isBlocked,
      isExpired: !!isExpired,
      isExpiringSoon,
      daysRemaining,
      hoursRemaining,
      minutesRemaining,
      trialEndsAt,
      subscriptionEndsAt,
      planType,
      timeRemainingText,
    });

    // Auto-block expired trial users
    if (isExpired && !isBlocked) {
      // Update user to blocked status in database
      await supabase
        .from('users_matricula')
        .update({ 
          plan_type: 'blocked',
          blocked: true 
        })
        .eq('matricula', user.userId);
      
      // Refresh user to get updated status
      await refreshUser();
      setShowBlockedModal(true);
    }

    // Show modals based on status
    if (isBlocked || isExpired) {
      setShowBlockedModal(true);
    } else if (isExpiringSoon) {
      // Show renewal modal if not already shown this session
      const renewalShown = sessionStorage.getItem('renewal_modal_shown');
      if (!renewalShown) {
        setShowRenewalModal(true);
        sessionStorage.setItem('renewal_modal_shown', 'true');
      }
    }

  }, [user, refreshUser]);

  // Check status on mount and periodically
  useEffect(() => {
    checkStatus();

    // Check every minute
    const interval = setInterval(checkStatus, 60000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  const closeRenewalModal = useCallback(() => {
    setShowRenewalModal(false);
  }, []);

  const closeBlockedModal = useCallback(() => {
    // Blocked modal can only be closed by subscribing
    // setShowBlockedModal(false);
  }, []);

  return {
    ...status,
    showRenewalModal,
    showBlockedModal,
    closeRenewalModal,
    closeBlockedModal,
    checkStatus,
  };
}
