import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, User, Mail, Phone, FileText, Wallet, ArrowRight, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type PixKeyType = "cpf" | "email" | "phone" | "random";

interface AffiliateLinkRecord {
  affiliate_code: string;
  affiliate_name?: string;
  is_active: boolean;
  is_blocked?: boolean;
}

export default function AffiliateSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [isValidatingLink, setIsValidatingLink] = useState(true);
  const [isValidLink, setIsValidLink] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>("parceiro INOVAFINANCE");

  // Success state - show matricula before redirecting
  const [showSuccess, setShowSuccess] = useState(() => {
    // Check if we just completed signup
    const savedMatricula = sessionStorage.getItem('affiliate_signup_matricula');
    return !!savedMatricula;
  });
  const [generatedMatricula, setGeneratedMatricula] = useState<number | null>(() => {
    const savedMatricula = sessionStorage.getItem('affiliate_signup_matricula');
    return savedMatricula ? parseInt(savedMatricula, 10) : null;
  });
  const [copied, setCopied] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("cpf");

  const headerSubtitle = useMemo(() => {
    if (isValidatingLink) return "Validando convite...";
    if (!isValidLink) return "Convite inválido ou expirado";
    return `Indicado por ${partnerName}`;
  }, [isValidatingLink, isValidLink, partnerName]);

  useEffect(() => {
    const rawCode =
      searchParams.get("ref") ||
      searchParams.get("affiliate") ||
      searchParams.get("code") ||
      searchParams.get("invite") ||
      searchParams.get("inv");

    const code = rawCode ? decodeURIComponent(rawCode).trim() : null;
    setInviteCode(code);

    const validate = async () => {
      setIsValidatingLink(true);
      setIsValidLink(false);
      setError("");

      try {
        // Accept any INV- or AFI- code as valid (fixed link approach)
        if (!code || !(code.startsWith("INV-") || code.startsWith("AFI-"))) {
          setError("Link de afiliado inválido.");
          return;
        }

        // All INV-xxxx and AFI-xxxx codes are valid - no need to check database
        setPartnerName("parceiro INOVAFINANCE");
        setIsValidLink(true);
      } catch (e: any) {
        console.error("Error validating affiliate invite:", e);
        setError(e?.message || "Erro ao validar convite");
      } finally {
        setIsValidatingLink(false);
      }
    };

    validate();
  }, [searchParams]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const generateMatricula = async (): Promise<number> => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const newMatricula = Math.floor(100000 + Math.random() * 900000);

      const { data } = await supabase
        .from("users_matricula")
        .select("matricula")
        .eq("matricula", newMatricula)
        .maybeSingle();

      if (!data) return newMatricula;
      attempts++;
    }

    throw new Error("Não foi possível gerar matrícula única");
  };

  const handleCreateAffiliate = async () => {
    if (!isValidLink || !inviteCode) {
      setError("Convite inválido.");
      return;
    }

    if (!fullName.trim()) {
      setError("Nome completo é obrigatório");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Telefone válido é obrigatório");
      return;
    }
    if (!cpf.trim() || cpf.replace(/\D/g, "").length !== 11) {
      setError("CPF válido é obrigatório");
      return;
    }
    if (!pixKey.trim()) {
      setError("Chave PIX é obrigatória para receber comissões");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const newMatricula = await generateMatricula();
      const now = new Date().toISOString();

      const { error: insertError } = await supabase.from("users_matricula").insert({
        matricula: newMatricula,
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim(),
        cpf: cpf.replace(/\D/g, ""),
        initial_balance: 0,
        user_status: "approved",
        blocked: false,
        subscription_type: "AFFILIATE_FREE",
        subscription_status: "active",
        subscription_start_date: now,
        subscription_end_date: null,
        is_affiliate: true,
        affiliate_code: newMatricula.toString(),
        affiliate_balance: 0,
        pix_key: pixKey.trim(),
        pix_key_type: pixKeyType,
        is_admin_affiliate: true,
        admin_affiliate_created_at: now,
        last_affiliate_sale_at: null,
        affiliate_deactivated_at: null,
        admin_affiliate_link_code: inviteCode,
      } as any);

      if (insertError) throw insertError;

      // Save matricula to sessionStorage before login (to persist across re-renders)
      sessionStorage.setItem('affiliate_signup_matricula', newMatricula.toString());

      // Auto-login
      await login(newMatricula, fullName.trim(), email.trim(), phone.trim(), 0);

      // Show success screen with matricula
      setGeneratedMatricula(newMatricula);
      setShowSuccess(true);
      setIsLoading(false);
    } catch (e: any) {
      console.error("Error creating affiliate:", e);
      setError(e?.message || "Erro ao criar conta de afiliado");
      setIsLoading(false);
    }
  };

  const handleGoToPanel = () => {
    // Clear the saved matricula from sessionStorage
    sessionStorage.removeItem('affiliate_signup_matricula');
    navigate("/afiliados");
  };

  // Success screen
  if (showSuccess && generatedMatricula) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="font-display text-2xl font-bold text-emerald-500 mb-2">
                Cadastro realizado!
              </h1>
              
              <p className="text-muted-foreground mb-6">
                Anote sua matrícula para acessar o painel de afiliados:
              </p>

              <div className="bg-background/50 border-2 border-emerald-500/30 rounded-xl p-6 mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Sua Matrícula
                </p>
                <p className="text-4xl font-mono font-bold tracking-widest text-emerald-500">
                  {generatedMatricula}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={async () => {
                  if (generatedMatricula) {
                    await navigator.clipboard.writeText(generatedMatricula.toString());
                    setCopied(true);
                    toast({ title: "Matrícula copiada!", description: "Sua matrícula foi copiada para a área de transferência." });
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="w-full mb-6"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Matrícula
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground mb-6">
                Use esta matrícula para fazer login em{" "}
                <span className="font-semibold text-foreground">/login/afiliados</span>
              </p>

              <Button
                onClick={handleGoToPanel}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 transition-opacity"
              >
                Acessar Painel de Afiliados
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-xl font-bold">Cadastro de Afiliado</h1>
                <p className="text-sm text-muted-foreground mt-1">{headerSubtitle}</p>
              </div>
            </div>

            {!isValidatingLink && !isValidLink && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error || "Convite inválido"}</span>
              </div>
            )}

            {isValidLink && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-sm">
                  Conta <span className="font-semibold">GRÁTIS</span> (sem mensalidade). Você recebe comissões via PIX.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome completo *
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="bg-background/50"
                  disabled={!isValidLink || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail (opcional)
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-background/50"
                  disabled={!isValidLink || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone *
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="bg-background/50"
                  disabled={!isValidLink || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CPF *
                </Label>
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="bg-background/50"
                  disabled={!isValidLink || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Chave PIX *
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Digite sua chave"
                    className="bg-background/50 col-span-2"
                    disabled={!isValidLink || isLoading}
                  />
                  <Button
                    type="button"
                    variant={pixKeyType === "cpf" ? "default" : "outline"}
                    onClick={() => setPixKeyType("cpf")}
                    disabled={!isValidLink || isLoading}
                  >
                    CPF
                  </Button>
                  <Button
                    type="button"
                    variant={pixKeyType === "phone" ? "default" : "outline"}
                    onClick={() => setPixKeyType("phone")}
                    disabled={!isValidLink || isLoading}
                  >
                    Telefone
                  </Button>
                  <Button
                    type="button"
                    variant={pixKeyType === "email" ? "default" : "outline"}
                    onClick={() => setPixKeyType("email")}
                    disabled={!isValidLink || isLoading}
                  >
                    E-mail
                  </Button>
                  <Button
                    type="button"
                    variant={pixKeyType === "random" ? "default" : "outline"}
                    onClick={() => setPixKeyType("random")}
                    disabled={!isValidLink || isLoading}
                  >
                    Aleatória
                  </Button>
                </div>
              </div>

              {error && isValidLink && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              <Button
                onClick={handleCreateAffiliate}
                disabled={!isValidLink || isLoading}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Criar conta e entrar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta de afiliado?{" "}
                <button onClick={() => navigate("/login/afiliados")} className="text-primary hover:underline">
                  Fazer login
                </button>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
