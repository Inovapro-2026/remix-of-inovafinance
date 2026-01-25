import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, LogIn, Loader2, AlertCircle, KeyRound } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function AffiliateLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [matricula, setMatricula] = useState("");

  const handleLogin = async () => {
    const cleanMatricula = matricula.replace(/\D/g, "");
    
    if (!cleanMatricula || cleanMatricula.length !== 6) {
      setError("Digite uma matrícula válida de 6 dígitos");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const matriculaNumber = parseInt(cleanMatricula, 10);

      // Check if this matricula exists and is an affiliate
      const { data: userData, error: fetchError } = await supabase
        .from("users_matricula")
        .select("matricula, full_name, email, phone, is_affiliate, user_status, blocked")
        .eq("matricula", matriculaNumber)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!userData) {
        setError("Matrícula não encontrada. Verifique o número ou cadastre-se como afiliado.");
        return;
      }

      if (!userData.is_affiliate) {
        setError("Esta matrícula não pertence a um afiliado. Use o login principal do app.");
        return;
      }

      if (userData.blocked) {
        setError("Sua conta de afiliado está bloqueada. Entre em contato com o suporte.");
        return;
      }

      if (userData.user_status !== "approved") {
        setError("Sua conta ainda está pendente de aprovação.");
        return;
      }

      // Attempt login
      const success = await login(
        userData.matricula,
        userData.full_name || undefined,
        userData.email || undefined,
        userData.phone || undefined,
        0
      );

      if (success) {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao painel de afiliados.",
        });
        navigate("/afiliados");
      } else {
        setError("Não foi possível fazer login. Tente novamente.");
      }
    } catch (e: any) {
      console.error("Affiliate login error:", e);
      setError(e?.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const formatMatricula = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 6);
  };

  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold">Painel de Afiliados</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Entre com sua matrícula de afiliado
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Matrícula (6 dígitos)
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={matricula}
                  onChange={(e) => setMatricula(formatMatricula(e.target.value))}
                  placeholder="000000"
                  className="bg-background/50 text-center text-2xl tracking-widest font-mono h-14"
                  maxLength={6}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLogin();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Digite a matrícula gerada no seu cadastro de afiliado
                </p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={isLoading || matricula.length !== 6}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Entrar
                  </>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ainda não é afiliado?
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/affiliate-signup?ref=INV-ADMIN")}
                  className="w-full"
                >
                  Cadastrar como afiliado
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground pt-4">
                Para usar o app financeiro,{" "}
                <button 
                  onClick={() => navigate("/login")} 
                  className="text-primary hover:underline"
                >
                  clique aqui
                </button>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
