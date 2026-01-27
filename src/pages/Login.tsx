import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Shield, User, Wallet, Mail, Phone, CreditCard, Calendar, UserPlus, Sparkles, Fingerprint, Briefcase, DollarSign, CalendarDays } from 'lucide-react';
import { NumericKeypad } from '@/components/NumericKeypad';
import { InstallAppButton } from '@/components/InstallAppButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
  isBiometricEnabled,
  authenticateWithBiometric,
} from '@/services/biometricService';
import { playAudioExclusively, stopAllAudio } from '@/services/audioManager';
import { wasLoginAudioPlayed, markLoginAudioPlayed, stopAllVoice } from '@/services/voiceQueueService';
import loginAudio from '@/assets/login-audio.mp3';

type Step = 'matricula' | 'register' | 'success' | 'pending' | 'rejected';

export default function Login() {
  const [step, setStep] = useState<Step>('matricula');
  const [matricula, setMatricula] = useState('');
  const [generatedMatricula, setGeneratedMatricula] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [creditDueDay, setCreditDueDay] = useState('');
  const [creditAvailable, setCreditAvailable] = useState('');
  const [hasCreditCard, setHasCreditCard] = useState<boolean | null>(null);
  const [isClt, setIsClt] = useState<boolean | null>(null);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryDay, setSalaryDay] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDay, setAdvanceDay] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, user, isLoading: authLoading } = useAuth();

  const loginAudioPlayedRef = useRef(false);
  const matriculaInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-fill matricula from URL query parameter
  useEffect(() => {
    const matriculaParam = searchParams.get('matricula');
    if (matriculaParam && matriculaParam.length === 6 && /^\d{6}$/.test(matriculaParam)) {
      setMatricula(matriculaParam);
    }
  }, [searchParams]);

  // Play login audio only once per session
  useEffect(() => {
    if (authLoading) return;
    if (location.pathname !== '/login') return;
    if (user) return;
    if (wasLoginAudioPlayed() || loginAudioPlayedRef.current) return;
    
    loginAudioPlayedRef.current = true;
    markLoginAudioPlayed();
    
    const timer = setTimeout(() => {
      stopAllVoice();
      stopAllAudio();
      const audio = new Audio(loginAudio);
      playAudioExclusively(audio).catch(console.error);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [user, authLoading, location.pathname]);

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      const supported = isBiometricSupported();
      const available = await isPlatformAuthenticatorAvailable();
      const enabled = isBiometricEnabled();
      setBiometricAvailable(supported && available);
      setBiometricEnabled(enabled);
    };
    checkBiometric();
  }, []);

  // Auto-submit when matricula reaches 6 digits
  useEffect(() => {
    if (matricula.length === 6 && !isLoading && step === 'matricula') {
      handleMatriculaSubmit();
    }
  }, [matricula]);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const storedMatricula = await authenticateWithBiometric();

      if (storedMatricula) {
        const { data: existingUser, error: fetchError } = await supabase
          .from('users_matricula')
          .select('*')
          .eq('matricula', storedMatricula)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingUser) {
          const userStatus = existingUser.user_status as string;

          if (userStatus === 'pending') {
            setStep('pending');
            return;
          }
          if (userStatus === 'rejected') {
            setStep('rejected');
            return;
          }
          if (userStatus === 'approved') {
            const success = await login(storedMatricula, existingUser.full_name || '');
            if (success) navigate('/');
            else setError('Erro ao fazer login');
          } else {
            setError('Status de conta inválido');
          }
        } else {
          setError('Usuário não encontrado');
        }
      } else {
        setError('Autenticação biométrica cancelada');
      }
    } catch (err) {
      console.error(err);
      setError('Erro na autenticação biométrica');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMatricula = async (): Promise<number> => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const newMatricula = Math.floor(100000 + Math.random() * 900000);
      const { data } = await supabase
        .from('users_matricula')
        .select('matricula')
        .eq('matricula', newMatricula)
        .maybeSingle();

      if (!data) return newMatricula;
      attempts++;
    }
    throw new Error('Não foi possível gerar matrícula única');
  };

  const handleMatriculaSubmit = async () => {
    if (matricula.length !== 6) {
      setError('Digite os 6 dígitos da matrícula');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users_matricula')
        .select('*')
        .eq('matricula', parseInt(matricula))
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingUser) {
        const userStatus = existingUser.user_status as string;

        if (userStatus === 'pending') {
          setStep('pending');
          return;
        }
        if (userStatus === 'rejected') {
          setStep('rejected');
          return;
        }
        if (userStatus === 'approved') {
          const success = await login(parseInt(matricula), existingUser.full_name || '');
          if (success) navigate('/');
          else setError('Erro ao fazer login');
        } else {
          setError('Status de conta inválido');
        }
      } else {
        setError('Matrícula não encontrada. Crie uma conta.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao verificar matrícula');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError('Digite seu nome completo');
      return;
    }
    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newMatricula = await generateMatricula();

      const { error: insertError } = await supabase
        .from('users_matricula')
        .insert({
          matricula: newMatricula,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          initial_balance: parseFloat(initialBalance) || 0,
          has_credit_card: hasCreditCard === true,
          credit_limit: hasCreditCard ? (parseFloat(creditLimit) || 0) : 0,
          credit_available: hasCreditCard ? (parseFloat(creditAvailable) || 0) : 0,
          credit_due_day: hasCreditCard ? (parseInt(creditDueDay) || 5) : null,
          salary_amount: isClt ? (parseFloat(salaryAmount) || 0) : 0,
          salary_day: isClt ? (parseInt(salaryDay) || 5) : 5,
          advance_amount: isClt ? (parseFloat(advanceAmount) || 0) : 0,
          advance_day: isClt && advanceDay ? (parseInt(advanceDay) || null) : null,
        });

      if (insertError) throw insertError;

      const dueDay = parseInt(creditDueDay) || 5;
      await login(
        newMatricula,
        fullName.trim(),
        email.trim(),
        phone.trim(),
        parseFloat(initialBalance) || 0,
        parseFloat(creditLimit) || 5000,
        dueDay
      );

      setGeneratedMatricula(newMatricula.toString());
      setStep('success');
    } catch (err) {
      console.error(err);
      setError('Erro ao registrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setMatricula('');
    setGeneratedMatricula('');
    setFullName('');
    setEmail('');
    setPhone('');
    setInitialBalance('');
    setCreditLimit('');
    setCreditDueDay('');
    setCreditAvailable('');
    setHasCreditCard(null);
    setIsClt(null);
    setSalaryAmount('');
    setSalaryDay('');
    setAdvanceAmount('');
    setAdvanceDay('');
    setStep('matricula');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5" />
            <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Wallet className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-gray-900">
              INOVAFINANCE
            </h1>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mt-2" />
          </div>
        </div>

        <p className="text-gray-600 text-sm mt-4 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Seu assistente financeiro inteligente
          <Sparkles className="w-4 h-4 text-emerald-500" />
        </p>
      </div>

      {/* Login Form */}
      {step === 'matricula' && (
        <div className="w-full max-w-sm">
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500/30 via-emerald-400/30 to-emerald-500/30 rounded-2xl" />
            
            <GlassCard className="relative p-6 bg-white border-0 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">Acesso Seguro</h2>
              </div>
              <p className="text-gray-600 text-sm text-center mb-6">
                Digite sua matrícula de 6 dígitos
              </p>

              {/* PIN Display */}
              <div
                className="relative flex justify-center gap-2 mb-6 cursor-pointer"
                onClick={() => matriculaInputRef.current?.focus()}
              >
                <input
                  ref={matriculaInputRef}
                  value={matricula}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setMatricula(onlyNumbers);
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  aria-label="Matrícula"
                  className="absolute inset-0 opacity-0"
                />

                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-11 h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-150 ${
                      matricula[i]
                        ? 'bg-emerald-100 border-2 border-emerald-500 shadow-sm'
                        : 'bg-gray-100 border-2 border-gray-200'
                    }`}
                  >
                    {matricula[i] && (
                      <span className="text-emerald-600 font-mono">{matricula[i]}</span>
                    )}
                    {!matricula[i] && i === matricula.length && (
                      <div className="w-0.5 h-6 bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>

              <NumericKeypad
                value={matricula}
                onChange={setMatricula}
                onSubmit={handleMatriculaSubmit}
                maxLength={6}
                autoSubmit={true}
              />

              {error && (
                <p className="text-red-600 text-sm text-center mt-4 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {error}
                </p>
              )}

              {isLoading && (
                <div className="flex justify-center mt-4">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Biometric Login Button */}
              {biometricAvailable && biometricEnabled && (
                <div className="mt-4">
                  <button
                    onClick={handleBiometricLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-medium shadow-md"
                  >
                    <Fingerprint className="w-5 h-5" />
                    Entrar com biometria
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Use sua digital ou Face ID
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => navigate('/subscribe')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-medium shadow-md"
                >
                  <CreditCard className="w-5 h-5" />
                  Assine agora
                </button>
                <button
                  onClick={() => navigate('/subscribe?trial=true')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700 font-medium"
                >
                  <Calendar className="w-5 h-5" />
                  Teste grátis por 7 dias
                </button>
              </div>
              
              <InstallAppButton />
            </GlassCard>
          </div>
        </div>
      )}

      {step === 'register' && (
        <div className="w-full max-w-sm max-h-[60dvh] overflow-y-auto pr-2 pb-4">
          <GlassCard className="p-6 bg-white shadow-lg">
            <h2 className="text-xl font-semibold text-center mb-1 text-gray-900">Criar conta</h2>
            <p className="text-gray-600 text-xs text-center mb-6">
              Complete seu cadastro para continuar
            </p>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-2 text-gray-700">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    Nome completo *
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Digite seu nome"
                    className="bg-gray-50 border-gray-200 h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-2 text-gray-700">
                    <Mail className="w-3.5 h-3.5 text-emerald-500" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-gray-50 border-gray-200 h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-2 text-gray-700">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    Número de telefone
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="bg-gray-50 border-gray-200 h-10 text-sm"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Saldo Débito */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  Saldo débito (conta)
                </label>
                <Input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="R$ 0,00"
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              {/* Pergunta Cartão de Crédito */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  Você tem cartão de crédito?
                </label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={hasCreditCard === true ? "default" : "outline"}
                    className={`flex-1 ${hasCreditCard === true ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => setHasCreditCard(true)}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    variant={hasCreditCard === false ? "default" : "outline"}
                    className={`flex-1 ${hasCreditCard === false ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => setHasCreditCard(false)}
                  >
                    Não
                  </Button>
                </div>
              </div>

              {/* Campos condicionais Cartão de Crédito */}
              {hasCreditCard === true && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      Limite total do cartão
                    </label>
                    <Input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="R$ 0,00"
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <Wallet className="w-4 h-4 text-emerald-500" />
                      Valor disponível atual
                    </label>
                    <Input
                      type="number"
                      value={creditAvailable}
                      onChange={(e) => setCreditAvailable(e.target.value)}
                      placeholder="R$ 0,00"
                      className="bg-gray-50 border-gray-200"
                    />
                    <p className="text-xs text-gray-500">
                      Quanto você tem disponível no cartão agora
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      Dia de vencimento da fatura
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={creditDueDay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!e.target.value || (val >= 1 && val <= 31)) {
                          setCreditDueDay(e.target.value);
                        }
                      }}
                      placeholder="Ex: 15"
                      className="bg-gray-50 border-gray-200"
                    />
                    <p className="text-xs text-gray-500">
                      No vencimento, o limite será restaurado para o valor total
                    </p>
                  </div>
                </div>
              )}

              {/* Pergunta CLT */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  Você é CLT?
                </label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={isClt === true ? "default" : "outline"}
                    className={`flex-1 ${isClt === true ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => setIsClt(true)}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    variant={isClt === false ? "default" : "outline"}
                    className={`flex-1 ${isClt === false ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => setIsClt(false)}
                  >
                    Não
                  </Button>
                </div>
              </div>

              {/* Campos condicionais CLT */}
              {isClt === true && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Valor do salário
                    </label>
                    <Input
                      type="number"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      placeholder="R$ 0,00"
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      Dia do pagamento do salário
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={salaryDay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!e.target.value || (val >= 1 && val <= 31)) {
                          setSalaryDay(e.target.value);
                        }
                      }}
                      placeholder="Ex: 5"
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4 text-blue-500" />
                      Valor do adiantamento
                    </label>
                    <Input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      placeholder="R$ 0,00 (opcional)"
                      className="bg-gray-50 border-gray-200"
                    />
                    <p className="text-xs text-gray-500">
                      Deixe em branco se não recebe adiantamento
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      Dia do adiantamento
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={advanceDay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!e.target.value || (val >= 1 && val <= 31)) {
                          setAdvanceDay(e.target.value);
                        }
                      }}
                      placeholder="Ex: 20"
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Criar conta'
                )}
              </Button>

              <button
                onClick={() => {
                  setStep('matricula');
                  setError('');
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Já tenho conta
              </button>
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center mt-4">{error}</p>
            )}
          </GlassCard>
        </div>
      )}

      {step === 'success' && (
        <div className="w-full max-w-sm">
          <GlassCard className="p-8 text-center bg-white shadow-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-xl font-bold mb-2 text-gray-900">
              Cadastro enviado para análise
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Seu cadastro foi recebido e está aguardando aprovação do administrador.<br />
              Assim que for aprovado, você poderá acessar todas as funcionalidades do INOVAFINANCE.
            </p>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Sua matrícula é:</p>
              <div className="flex justify-center gap-2">
                {generatedMatricula.split('').map((digit, i) => (
                  <div
                    key={i}
                    className="w-12 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                  >
                    {digit}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Guarde sua matrícula. Você usará ela para acessar sua conta após aprovação.
              </p>
            </div>

            <Button
              onClick={handleGoToLogin}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90"
            >
              Entendi
            </Button>
          </GlassCard>
        </div>
      )}

      {step === 'pending' && (
        <div className="w-full max-w-sm">
          <GlassCard className="p-8 text-center bg-white shadow-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>

            <h2 className="text-xl font-bold mb-2 text-gray-900">⏳ Conta em análise</h2>
            <p className="text-gray-600 text-sm mb-6">
              Seu cadastro ainda não foi aprovado pelo administrador.<br />
              Aguarde a aprovação para acessar sua conta.
            </p>

            <Button onClick={() => setStep('matricula')} variant="outline" className="w-full">
              Sair
            </Button>
          </GlassCard>
        </div>
      )}

      {step === 'rejected' && (
        <div className="w-full max-w-sm">
          <GlassCard className="p-8 text-center bg-white shadow-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <UserPlus className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-xl font-bold mb-2 text-red-600">❌ Cadastro não aprovado</h2>
            <p className="text-gray-600 text-sm mb-6">
              Seu cadastro foi analisado e não foi aprovado.<br />
              Entre em contato com o suporte para mais informações.
            </p>

            <Button onClick={() => setStep('matricula')} variant="outline" className="w-full">
              Voltar
            </Button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
