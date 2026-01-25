import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Bell, Palette, LogOut, Smartphone, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { VoiceSettings } from '@/components/VoiceSettings';
import { InstallAppButton } from '@/components/InstallAppButton';
import { toast } from 'sonner';
import {
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
  isBiometricEnabled,
  registerBiometric,
  disableBiometric
} from '@/services/biometricService';
import {
  isNotificationSupported,
  hasNotificationPermission,
  requestNotificationPermission,
  sendTestNotification
} from '@/services/notificationService';

const ROUTINE_REMINDERS_KEY = 'inovabank_routine_reminders';

import { useTheme } from '@/contexts/ThemeContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Biometric state
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsLoading, setBiometricsLoading] = useState(false);

  // Notification states
  const [pushEnabled, setPushEnabled] = useState(false);
  const [routineReminders, setRoutineReminders] = useState(() => {
    return localStorage.getItem(ROUTINE_REMINDERS_KEY) !== 'false';
  });


  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      const supported = isBiometricSupported();
      const available = await isPlatformAuthenticatorAvailable();
      setBiometricsAvailable(supported && available);
      setBiometricsEnabled(isBiometricEnabled());
    };

    checkBiometrics();

    // Check notification permission
    setPushEnabled(hasNotificationPermission());
  }, []);

  // Handle biometric toggle
  const handleBiometricToggle = async (enabled: boolean) => {
    if (!user) return;

    setBiometricsLoading(true);

    try {
      if (enabled) {
        const success = await registerBiometric(user.userId, user.fullName || '');
        if (success) {
          setBiometricsEnabled(true);
          toast.success('Autenticação biométrica ativada!', {
            description: 'Agora você pode fazer login usando biometria.'
          });
        } else {
          toast.error('Não foi possível ativar a biometria');
        }
      } else {
        disableBiometric();
        setBiometricsEnabled(false);
        toast.success('Autenticação biométrica desativada');
      }
    } catch (error) {
      console.error('Biometric error:', error);
      toast.error('Erro ao configurar biometria');
    } finally {
      setBiometricsLoading(false);
    }
  };


  // Handle push notification toggle
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!isNotificationSupported()) {
        toast.error('Notificações não são suportadas neste navegador');
        return;
      }

      const granted = await requestNotificationPermission();
      if (granted) {
        setPushEnabled(true);
        toast.success('Notificações ativadas!');
        // Send a test notification
        setTimeout(() => {
          sendTestNotification();
        }, 1000);
      } else {
        toast.error('Permissão de notificação negada');
      }
    } else {
      // Can't programmatically revoke, but we can stop sending
      setPushEnabled(false);
      localStorage.removeItem('inovabank_notifications_enabled');
      toast.success('Notificações desativadas');
    }
  };

  // Handle routine reminders toggle
  const handleRoutineRemindersToggle = (enabled: boolean) => {
    setRoutineReminders(enabled);
    localStorage.setItem(ROUTINE_REMINDERS_KEY, enabled.toString());

    if (enabled) {
      toast.success('Lembretes de rotina ativados');
    } else {
      toast.success('Lembretes de rotina desativados');
    }

    // Dispatch event for SW to pick up
    window.dispatchEvent(new CustomEvent('routineRemindersChanged', { detail: { enabled } }));
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Até logo!');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  // Check if user has active subscription
  const hasActiveSubscription = user.planType === 'paid' || user.subscriptionStatus === 'active';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background px-4 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{user.fullName || 'Usuário'}</h1>
          <p className="text-muted-foreground">Matrícula: {user.userId}</p>
          {user.email && (
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          )}
        </motion.div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Voice Settings Card */}
        <VoiceSettings />

        {/* Account Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Conta e Segurança
            </CardTitle>
            <CardDescription>
              Gerencie suas informações de conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span>Autenticação biométrica</span>
                  {!biometricsAvailable && (
                    <p className="text-xs text-muted-foreground">Não disponível neste dispositivo</p>
                  )}
                </div>
              </div>
              <Switch
                checked={biometricsEnabled}
                onCheckedChange={handleBiometricToggle}
                disabled={!biometricsAvailable || biometricsLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure suas preferências de notificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span>Notificações push</span>
                  <p className="text-xs text-muted-foreground">
                    {isNotificationSupported()
                      ? 'Receba alertas mesmo com o app fechado'
                      : 'Não suportado neste navegador'}
                  </p>
                </div>
              </div>
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={!isNotificationSupported()}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span>Lembretes de rotina</span>
                  <p className="text-xs text-muted-foreground">Notificações 15min antes das rotinas</p>
                </div>
              </div>
              <Switch
                checked={routineReminders}
                onCheckedChange={handleRoutineRemindersToggle}
                disabled={!pushEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize a experiência visual do app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <span className="text-sm">🌙</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center">
                    <span className="text-sm">☀️</span>
                  </div>
                )}
                <div>
                  <span>Modo Escuro (Black)</span>
                  <p className="text-xs text-muted-foreground">
                    {theme === 'dark'
                      ? 'Tema escuro premium ativado'
                      : 'Alternar para tema escuro'}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>


        {/* App Info */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Sobre o App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Versão</span>
              <span>2.0.0</span>
            </div>

            {/* Only show plan info if NOT active subscription */}
            {!hasActiveSubscription && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="text-primary font-medium">
                    {user.planType === 'free_trial' ? 'Teste Grátis' : 'Básico'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={user.userStatus === 'approved' ? 'text-emerald-500' : 'text-amber-500'}>
                    {user.userStatus === 'approved' ? 'Ativo' : 'Pendente'}
                  </span>
                </div>
              </>
            )}

            {/* Show Premium badge if active */}
            {hasActiveSubscription && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plano</span>
                <span className="text-primary font-medium">✓ Premium Ativo</span>
              </div>
            )}

            {/* Install App Button */}
            <InstallAppButton className="mt-4" />
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
}
