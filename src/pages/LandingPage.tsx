import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wallet, Brain, Clock, BarChart3, Shield, Cloud, 
  CheckCircle, Sparkles, ArrowRight, MessageCircle,
  CreditCard, TrendingUp, Bell, Calendar, Target,
  ChevronDown, Zap, Users, Lock, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  useEffect(() => {
    // Capture affiliate code from URL and save to localStorage
    const ref = searchParams.get('ref') || 
                searchParams.get('affiliate') || 
                searchParams.get('code') || 
                searchParams.get('invite') ||
                searchParams.get('inv');
    
    if (ref) {
      const decodedRef = decodeURIComponent(ref).trim();
      localStorage.setItem('inovafinance_affiliate_ref', decodedRef);
      setAffiliateCode(decodedRef);
    } else {
      // Check if there's a saved ref
      const savedRef = localStorage.getItem('inovafinance_affiliate_ref');
      if (savedRef) {
        setAffiliateCode(savedRef);
      }
    }
  }, [searchParams]);

  const handleCTAClick = () => {
    if (affiliateCode) {
      navigate(`/subscribe?ref=${encodeURIComponent(affiliateCode)}`);
    } else {
      navigate('/subscribe');
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Plataforma Inteligente de Finanças</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Controle sua <span className="text-primary">vida financeira</span> e sua <span className="text-primary">rotina</span> em um só lugar.
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              O INOVAFINACE é uma plataforma inteligente que organiza seus gastos, sua renda, seus compromissos e seu tempo usando tecnologia e inteligência artificial.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleCTAClick}
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                Quero me cadastrar agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => scrollToSection('features')}
                className="text-lg px-8 py-6"
              >
                Saiba como funciona
                <ChevronDown className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Financial Management Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-4">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-500 font-medium">Gestão Financeira</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Saiba exatamente para onde seu dinheiro está indo
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sem contas confusas ou planilhas complicadas. Tenha controle total das suas finanças.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Controle de Entradas', desc: 'Registre todos os seus recebimentos' },
              { icon: CreditCard, title: 'Controle de Gastos', desc: 'Acompanhe cada despesa realizada' },
              { icon: Target, title: 'Organização por Categorias', desc: 'Classifique seus gastos automaticamente' },
              { icon: Calendar, title: 'Controle por Período', desc: 'Visualize por dia, semana ou mês' },
              { icon: BarChart3, title: 'Relatórios Automáticos', desc: 'Gráficos e análises completas' },
              { icon: Bell, title: 'Alertas Inteligentes', desc: 'Notificações de gastos excessivos' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 h-full hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Routine Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-500 font-medium">Rotina Inteligente</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Organize seu tempo com inteligência
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Planeje sua rotina diária e semanal com ajuda de IA que sugere melhorias.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {[
                { title: 'Organização da rotina diária', desc: 'Planeje cada dia de forma eficiente' },
                { title: 'Planejamento semanal', desc: 'Visualize toda sua semana de uma vez' },
                { title: 'IA que sugere melhorias', desc: 'Receba sugestões personalizadas' },
                { title: 'Lembretes automáticos', desc: 'Nunca mais esqueça compromissos' },
                { title: 'Metas de rotina', desc: 'Acompanhe seu progresso diário' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-6 bg-card/80">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Chat com IA</p>
                    <p className="text-xs text-muted-foreground">Estilo WhatsApp</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm text-foreground">"me lembre de sair amanhã às 14h"</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 max-w-[80%] ml-auto">
                    <p className="text-sm text-primary">✅ Lembrete criado para amanhã às 14:00</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm text-foreground">"adicione trabalhar de segunda a sexta"</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 max-w-[80%] ml-auto">
                    <p className="text-sm text-primary">✅ Rotina de trabalho configurada!</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 mb-4">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-purple-500 font-medium">Inteligência Artificial</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sua assistente pessoal 24 horas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conversa natural, respostas inteligentes. A IA que entende suas necessidades.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'IA Integrada 24h', desc: 'Sempre disponível para ajudar' },
              { icon: MessageCircle, title: 'Conversa Natural', desc: 'Fale como fala com um amigo' },
              { icon: Brain, title: 'Análise Comportamental', desc: 'Entende seus padrões e hábitos' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-8 text-center h-full hover:border-purple-500/30 transition-colors">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <item.icon className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All in One Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para organizar sua vida.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { icon: Wallet, title: 'Financeiro', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: Brain, title: 'IA', color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { icon: Clock, title: 'Rotina', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: BarChart3, title: 'Relatórios', color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { icon: Shield, title: 'Segurança', color: 'text-red-500', bg: 'bg-red-500/10' },
              { icon: Cloud, title: 'Nuvem', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-6 text-center hover:scale-105 transition-transform">
                  <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Plano Único</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Plano INOVAFINACE
            </h2>

            <GlassCard className="p-8 md:p-12 mt-8 max-w-lg mx-auto border-primary/30">
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl md:text-6xl font-bold text-primary">R$ 29,90</span>
                </div>
                <p className="text-muted-foreground mt-2">por mês</p>
              </div>

              <div className="space-y-4 mb-8 text-left">
                {[
                  'Acesso completo à plataforma',
                  'Controle financeiro ilimitado',
                  'Rotina inteligente',
                  'IA 24h disponível',
                  'Relatórios automáticos',
                  'Suporte dedicado',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                onClick={handleCTAClick}
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                Quero assinar agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher o INOVAFINACE?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, text: 'Simples de usar' },
              { icon: Sparkles, text: 'Interface moderna' },
              { icon: Users, text: 'Para todos os perfis' },
              { icon: Cloud, text: 'Funciona em qualquer dispositivo' },
              { icon: Zap, text: 'Sem burocracia' },
              { icon: BarChart3, text: 'Sem planilhas complicadas' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-lg font-medium text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20 mb-4">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500 font-medium">Segurança</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Seus dados estão protegidos
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mt-10">
              {[
                { icon: Lock, title: 'Dados Criptografados', desc: 'Proteção de ponta a ponta' },
                { icon: Shield, title: 'Acesso Seguro', desc: 'Autenticação protegida' },
                { icon: Users, title: 'LGPD Compliant', desc: 'Respeito à sua privacidade' },
                { icon: CreditCard, title: 'Pagamento Seguro', desc: 'Via Mercado Pago' },
              ].map((item, i) => (
                <GlassCard key={i} className="p-6 text-left">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-primary/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Comece hoje a organizar sua vida financeira e sua rotina.
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Junte-se a milhares de pessoas que já transformaram suas finanças.
            </p>
            <Button 
              size="lg" 
              onClick={handleCTAClick}
              className="text-xl px-12 py-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30"
            >
              🚀 Quero me cadastrar agora
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} INOVAFINACE. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
