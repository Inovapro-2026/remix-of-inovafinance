import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getProfile, createProfile, updateProfile, type Profile } from '@/lib/db';
import { clearFinancialGreeted } from '@/services/isaVoiceService';
import { startSession, endSession } from '@/services/sessionTrackingService';
import { clearTabGreetings } from '@/services/voiceQueueService';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  login: (
    matricula: number, 
    fullName?: string, 
    email?: string,
    phone?: string,
    initialBalance?: number,
    creditLimit?: number,
    creditDueDay?: number
  ) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Keep a single Context instance across Fast Refresh/HMR to avoid "used within a provider" false negatives.
const AuthContext: React.Context<AuthContextType | undefined> =
  ((globalThis as unknown as { __INOVABANK_AUTH_CONTEXT__?: React.Context<AuthContextType | undefined> })
    .__INOVABANK_AUTH_CONTEXT__) ?? createContext<AuthContextType | undefined>(undefined);

(globalThis as unknown as { __INOVABANK_AUTH_CONTEXT__?: React.Context<AuthContextType | undefined> }).__INOVABANK_AUTH_CONTEXT__ =
  AuthContext;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedMatricula = localStorage.getItem('inovabank_matricula');
    if (storedMatricula) {
      loadUser(parseInt(storedMatricula, 10));
    } else {
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe();
      }
    };
  }, []);

  // Track presence when user changes
  useEffect(() => {
    if (user) {
      trackUserPresence(user);
    }
  }, [user]);

  const trackUserPresence = async (profile: Profile) => {
    await startSession(profile.userId, profile.fullName);

    const channel = supabase.channel('online-users');
    presenceChannelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          matricula: profile.userId,
          name: profile.fullName || `Mat. ${profile.userId}`,
          online_at: new Date().toISOString()
        });
      }
    });
  };

  const loadUser = async (matricula: number) => {
    try {
      const profile = await getProfile(matricula);
      if (profile) {
        if (profile.userStatus === 'approved') {
          setUser(profile);
        } else {
          localStorage.removeItem('inovabank_matricula');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (user?.userId) {
      const profile = await getProfile(user.userId);
      if (profile) {
        setUser(profile);
      }
    }
  };

  const login = async (
    matricula: number, 
    fullName?: string, 
    email?: string,
    phone?: string,
    initialBalance?: number,
    creditLimit?: number,
    creditDueDay?: number
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      let profile = await getProfile(matricula);
      
      if (!profile && fullName) {
        await createProfile({
          userId: matricula,
          fullName,
          email: email || '',
          phone: phone || '',
          initialBalance: initialBalance || 0,
          hasCreditCard: false,
          creditLimit: creditLimit || 0,
          creditAvailable: 0,
          creditUsed: 0,
          creditDueDay: creditDueDay,
          userStatus: 'pending',
          isAffiliate: false,
          affiliateBalance: 0,
          saldoAtual: initialBalance || 0,
          ganhoTotal: 0,
          gastoTotal: 0,
          onboardingCompleted: false,
          onboardingStep: 0,
          planType: 'none',
          blocked: false,
        });
        profile = await getProfile(matricula);
      }
      
      if (profile) {
        if (profile.userStatus === 'approved') {
          clearTabGreetings();
          clearFinancialGreeted();
          setUser(profile);
          localStorage.setItem('inovabank_matricula', matricula.toString());
          return true;
        }
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Get user by auth_user_id
        const { data: userData } = await supabase
          .from('users_matricula')
          .select('matricula')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        if (userData?.matricula) {
          const profile = await getProfile(userData.matricula);
          if (profile && profile.userStatus === 'approved') {
            clearTabGreetings();
            clearFinancialGreeted();
            setUser(profile);
            localStorage.setItem('inovabank_matricula', userData.matricula.toString());
            setIsLoading(false);
            return { success: true };
          }
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Usuário não encontrado ou não aprovado' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    await endSession();
    
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.unsubscribe();
      presenceChannelRef.current = null;
    }

    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('inovabank_matricula');
    sessionStorage.removeItem('login_audio_played');
    sessionStorage.removeItem('intro_video_shown');
    clearFinancialGreeted();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
