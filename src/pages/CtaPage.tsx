import { motion } from "framer-motion";
import { 
  Wallet, BarChart3, Bot, Smartphone, TrendingUp, TrendingDown, 
  Target, Bell, Shield, Check, ChevronRight, Sparkles, 
  MessageSquare, PiggyBank, CreditCard, Calendar, Zap,
  Users, Briefcase, Home, ShoppingCart, AlertTriangle,
  CircleDollarSign, Eye, Lock, Cloud, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CTA_LINK = "https://inovabank.inovapro.cloud/subscribe?trial=true";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <div className="mb-8">
            <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
              INOVA<span className="text-white">FINANCE</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Tenha controle total do seu{" "}
            <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              dinheiro
            </span>{" "}
            antes do mês acabar.
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            O INOVAFINANCE organiza seus ganhos, gastos e metas financeiras automaticamente, 
            mostrando exatamente quanto você pode gastar sem entrar no vermelho.
          </p>

          {/* Badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 mb-10"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {[
              { icon: Wallet, text: "Controle financeiro inteligente" },
              { icon: BarChart3, text: "Relatórios automáticos" },
              { icon: Bot, text: "IA financeira integrada" },
              { icon: Smartphone, text: "Funciona no celular e computador" }
            ].map((badge, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 backdrop-blur-sm"
              >
                <badge.icon className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-200">{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-8 py-6 text-lg rounded-full shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
              onClick={() => window.open(CTA_LINK, "_blank")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Teste grátis por 7 dias
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Sem cartão de crédito • Cancele quando quiser
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-8 h-8 text-purple-400/50" />
        </motion.div>
      </div>
    </section>
  );
}

// Problem Section
function ProblemSection() {
  const problems = [
    { icon: AlertTriangle, text: "Dinheiro acaba antes do fim do mês" },
    { icon: Eye, text: "Falta de controle financeiro" },
    { icon: ShoppingCart, text: "Gastos invisíveis que não percebe" },
    { icon: Calendar, text: "Falta de organização" },
    { icon: CircleDollarSign, text: "Não sabe quanto pode gastar" },
    { icon: PiggyBank, text: "Nunca sobra dinheiro" }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Você trabalha, recebe dinheiro…{" "}
            <span className="text-red-400">mas não sabe para onde ele vai?</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <problem.icon className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-muted-foreground">{problem.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Solution Section
function SolutionSection() {
  const solutions = [
    "Organiza toda sua vida financeira",
    "Calcula automaticamente ganhos e gastos",
    "Mostra saldo disponível em tempo real",
    "Ajuda a economizar dinheiro",
    "Evita surpresas no fim do mês"
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent" />
      
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O <span className="text-purple-400">INOVAFINANCE</span> resolve isso para você.
          </h2>
        </motion.div>

        <div className="space-y-4">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">{solution}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Cadastre seus ganhos",
      description: "Salário, bicos, freelas, entradas extras.",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500"
    },
    {
      number: "2",
      title: "Registre seus gastos",
      description: "Aluguel, mercado, contas, cartão, lazer.",
      icon: TrendingDown,
      color: "from-red-500 to-orange-500"
    },
    {
      number: "3",
      title: "Acompanhe tudo automaticamente",
      description: "Ganhos, gastos, saldo e previsões.",
      icon: BarChart3,
      color: "from-purple-500 to-violet-500"
    }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Como funciona?
          </h2>
          <p className="text-muted-foreground text-lg">
            Simples assim. Em 3 passos você já está no controle.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 group"
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
                step.color
              )}>
                <step.icon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 font-bold">{step.number}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Dashboard Section
function DashboardSection() {
  const features = [
    { icon: TrendingUp, label: "Ganhos totais", color: "text-green-400" },
    { icon: TrendingDown, label: "Gastos totais", color: "text-red-400" },
    { icon: Wallet, label: "Saldo disponível", color: "text-purple-400" },
    { icon: Calendar, label: "Histórico mensal", color: "text-blue-400" },
    { icon: BarChart3, label: "Gráficos automáticos", color: "text-violet-400" }
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-purple-900/20" />
      
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            📊 Dashboard Inteligente
          </h2>
          <p className="text-muted-foreground text-lg">
            Tudo que você precisa ver, em um só lugar. Atualização em tempo real.
          </p>
        </motion.div>

        {/* Mock Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative p-1 rounded-3xl bg-gradient-to-br from-purple-500/50 to-violet-500/50"
        >
          <div className="bg-card rounded-3xl p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center p-4 rounded-xl bg-background/50 border border-border/50"
                >
                  <feature.icon className={cn("w-8 h-8 mb-2", feature.color)} />
                  <span className="text-sm text-muted-foreground text-center">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// AI Section
function AISection() {
  const capabilities = [
    "Registrar gastos por mensagem",
    "Analisar hábitos financeiros",
    "Responder dúvidas",
    "Gerar insights automáticos",
    "Auxiliar no controle mensal"
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">Exclusivo</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🤖 IA Financeira Inteligente
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Uma inteligência artificial que entende sua vida financeira.
            </p>

            <ul className="space-y-3 mb-8">
              {capabilities.map((cap, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="text-muted-foreground">{cap}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Chat Example */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">ISA - Assistente IA</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-purple-600 rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                    <p className="text-white text-sm">"Gastei 40 reais no mercado hoje."</p>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%]">
                    <p className="text-foreground text-sm">
                      ✅ Registrado! Gasto de R$ 40,00 na categoria Mercado. 
                      Seu saldo disponível agora é R$ 1.250,00.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Features Grid Section
function FeaturesSection() {
  const features = [
    {
      icon: Target,
      title: "🎯 Metas Financeiras",
      items: [
        "Crie objetivos financeiros",
        "Acompanhe progresso",
        "Saiba quanto guardar por mês",
        "Organize sonhos e planos"
      ]
    },
    {
      icon: Bell,
      title: "🔔 Alertas e Lembretes",
      items: [
        "Avisos de gastos excessivos",
        "Lembretes de contas",
        "Controle antes do dinheiro acabar"
      ]
    },
    {
      icon: Smartphone,
      title: "📱 Acesso Simples",
      items: [
        "Funciona no celular",
        "Funciona no computador",
        "Não precisa instalar",
        "Pode virar aplicativo (PWA)"
      ]
    },
    {
      icon: Shield,
      title: "🔐 Segurança",
      items: [
        "Dados criptografados",
        "Sistema em nuvem",
        "Backup automático",
        "Login seguro"
      ]
    }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300"
            >
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <ul className="space-y-2">
                {feature.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Target Audience Section
function AudienceSection() {
  const audiences = [
    { icon: Briefcase, label: "Trabalhadores CLT" },
    { icon: Users, label: "Autônomos" },
    { icon: Zap, label: "Freelancers" },
    { icon: Home, label: "Pequenos empreendedores" },
    { icon: PiggyBank, label: "Quem quer sair do aperto financeiro" }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />
      
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            💜 Para quem é o INOVAFINANCE?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
            >
              <audience.icon className="w-6 h-6 text-purple-400" />
              <span className="text-white">{audience.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/50 to-violet-900/50 border border-purple-500/30 backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">Oferta especial</span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              🟣 Teste grátis por 7 dias
            </h2>
            
            <ul className="space-y-3 my-8 text-left max-w-xs mx-auto">
              <li className="flex items-center gap-3 text-muted-foreground">
                <Check className="w-5 h-5 text-green-400" />
                Sem cartão de crédito
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Check className="w-5 h-5 text-green-400" />
                Sem fidelidade
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Check className="w-5 h-5 text-green-400" />
                Cancele quando quiser
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Check className="w-5 h-5 text-green-400" />
                Acesso completo a todas as funções
              </li>
            </ul>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white py-6 text-lg rounded-full shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
              onClick={() => window.open(CTA_LINK, "_blank")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Começar teste grátis
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    { text: "Agora sei exatamente quanto posso gastar.", author: "Maria S." },
    { text: "Finalmente consigo guardar dinheiro.", author: "João P." },
    { text: "Sistema simples e muito fácil.", author: "Ana C." },
    { text: "Mudou minha organização financeira.", author: "Carlos M." }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ⭐ O que dizem nossos usuários
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
              <p className="text-sm text-purple-400">— {testimonial.author}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection() {
  const faqs = [
    { q: "Preciso de cartão para testar?", a: "Não. O teste é 100% gratuito e não pede cartão." },
    { q: "Posso cancelar depois?", a: "Sim, você pode cancelar a qualquer momento sem burocracia." },
    { q: "Funciona no celular?", a: "Sim! Funciona perfeitamente no celular e computador." },
    { q: "É difícil usar?", a: "Não, qualquer pessoa consegue usar. Interface simples e intuitiva." }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ❓ Perguntas Frequentes
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-border/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-4 flex items-center justify-between text-left bg-card/50 hover:bg-card/80 transition-colors"
              >
                <span className="font-medium text-white">{faq.q}</span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-purple-400 transition-transform",
                  openIndex === index && "rotate-180"
                )} />
              </button>
              {openIndex === index && (
                <div className="p-4 bg-muted/20 border-t border-border/50">
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Final CTA Section
function FinalCTASection() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px]" />
      
      <div className="max-w-3xl mx-auto relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            🚀 Comece hoje a ter{" "}
            <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              controle total
            </span>{" "}
            do seu dinheiro.
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8">
            Junte-se a milhares de pessoas que já transformaram sua vida financeira.
          </p>

          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-10 py-7 text-xl rounded-full shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
            onClick={() => window.open(CTA_LINK, "_blank")}
          >
            <Sparkles className="w-6 h-6 mr-2" />
            Teste grátis por 7 dias
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>

          <p className="text-sm text-muted-foreground mt-6">
            Sem cartão • Sem compromisso • Cancele quando quiser
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-border/50">
      <div className="max-w-6xl mx-auto text-center">
        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
          INOVA<span className="text-white">FINANCE</span>
        </span>
        <p className="text-sm text-muted-foreground mt-2">
          © 2024 INOVAFINANCE. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

// Main Page Component
export default function CtaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <DashboardSection />
      <AISection />
      <FeaturesSection />
      <AudienceSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
