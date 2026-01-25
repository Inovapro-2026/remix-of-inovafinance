import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  Clock,
  Target,
  Zap,
  Calendar,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  MessageCircle,
  TrendingUp,
  Bell,
  Mic,
  MicOff,
  Settings,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/ModeToggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoutineAnalytics } from '@/components/routines/RoutineAnalytics';
import { ProductivityCharts } from '@/components/routines/ProductivityCharts';
import { routineNotificationService } from '@/services/routineNotificationService';
import { sendGroqMessage, ChatMessage as GroqMessage, UserRoutineContext } from '@/services/groqAIService';
import { isaSpeak, inovaStop } from '@/services/isaVoiceService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

type ViewMode = 'chat' | 'analise' | 'graficos';

const QUICK_PROMPTS = [
  { icon: Sparkles, text: "Dicas de foco", prompt: "Me dê 3 dicas práticas para manter o foco hoje." },
  { icon: Clock, text: "Rotina matinal", prompt: "Como posso melhorar minha rotina matinal para ter mais energia?" },
  { icon: Target, text: "Metas SMART", prompt: "Como transformar meus objetivos em metas SMART?" },
  { icon: Zap, text: "Técnica Pomodoro", prompt: "Como aplicar a técnica Pomodoro na minha rotina de estudos?" },
];

export default function RotinaInteligente() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize notifications and load history
  useEffect(() => {
    const init = async () => {
      if (user) {
        // Initialize notifications
        await routineNotificationService.initialize();
        await routineNotificationService.scheduleRoutineAlerts(user.userId);

        // Load chat history
        loadMessages();
      }
    };
    init();

    return () => {
      routineNotificationService.destroy();
      inovaStop();
    };
  }, [user]);

  // Load chat history from Supabase
  const loadMessages = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('routine_chat_messages')
        .select('*')
        .eq('user_matricula', user.userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages((data || []) as ChatMessage[]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Handle sending a message
  const sendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || !user || isLoading) return;

    setInputValue('');
    setIsLoading(true);

    // Optimistically add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // 1. Save user message to database
      await supabase.from('routine_chat_messages').insert({
        user_matricula: user.userId,
        role: 'user',
        content: messageText
      });

      // 2. Prepare history for AI
      const history = [...messages, userMessage].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // 3. Fetch user's agenda and routines for context
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const [agendaResult, rotinasResult, executionsResult] = await Promise.all([
        supabase
          .from('agenda_items')
          .select('titulo, descricao, data, hora, tipo, concluido')
          .eq('user_matricula', user.userId)
          .gte('data', today)
          .lte('data', nextWeekStr)
          .order('data', { ascending: true })
          .order('hora', { ascending: true }),
        
        supabase
          .from('rotinas')
          .select('titulo, descricao, hora, hora_fim, dias_semana, categoria, prioridade, ativo')
          .eq('user_matricula', user.userId)
          .eq('ativo', true),
        
        supabase
          .from('rotina_executions')
          .select('data, scheduled_time, status')
          .eq('user_matricula', user.userId)
          .eq('data', today)
      ]);

      const userContext: UserRoutineContext = {
        agendaItems: agendaResult.data?.map(a => ({
          titulo: a.titulo,
          data: a.data,
          hora: a.hora,
          tipo: a.tipo,
          concluido: a.concluido || false
        })) || [],
        rotinas: rotinasResult.data?.map(r => ({
          titulo: r.titulo,
          hora: r.hora,
          hora_fim: r.hora_fim || undefined,
          dias_semana: r.dias_semana,
          categoria: r.categoria || undefined,
          prioridade: r.prioridade || undefined
        })) || [],
        executions: executionsResult.data?.map(e => ({
          scheduled_time: e.scheduled_time,
          status: e.status
        })) || []
      };

      // 4. Get AI response (Direct Groq integration for speed and reliability)
      const { message: aiResponse, error: groqError } = await sendGroqMessage(messageText, history, userContext);

      if (groqError) {
        // Fallback to Edge Function if direct Groq fails
        console.warn('[Direct Groq Failed] Trying Edge Function...', groqError);

        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('routine-ai-chat', {
          body: { message: messageText, history, userMatricula: user.userId }
        });

        if (edgeError) {
          throw new Error('Falha total na conexão com a IA. Verifique sua chave API.');
        }

        const finalResponse = edgeData.message;
        handleAIResponse(finalResponse);
      } else {
        handleAIResponse(aiResponse);
      }

    } catch (err) {
      console.error('Error communicating with AI:', err);
      toast.error('Não consegui te responder agora. Tente novamente em instantes.');
      // Remove the optimistic message
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIResponse = async (response: string) => {
    if (!user) return;

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, aiMessage]);

    // Save AI response to DB
    await supabase.from('routine_chat_messages').insert({
      user_matricula: user.userId,
      role: 'assistant',
      content: response
    });

    // Speak if voice is enabled (optional/context dependent)
    if (isVoiceActive) {
      isaSpeak(response, 'routine');
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('routine_chat_messages')
        .delete()
        .eq('user_matricula', user.userId);
      if (error) throw error;
      setMessages([]);
      toast.success('Conversa reiniciada!');
    } catch (err) {
      toast.error('Erro ao limpar histórico.');
    }
  };

  // UI Components
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      {/* Header */}
      <header className="sticky top-0 z-50 p-4 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">INOVAPRO <span className="text-purple-400">AI</span></h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Llama 3.3 70B Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full transition-all", isVoiceActive ? "bg-purple-500/20 text-purple-400" : "text-white/40")}
              onClick={() => setIsVoiceActive(!isVoiceActive)}
            >
              {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/40 rounded-full hover:bg-white/5">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#121214] border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar conversa?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60">
                    Iso apagará permanentemente todo o histórico deste chat.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-red-500 hover:bg-red-600">Apagar Tudo</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="h-6 w-px bg-white/10 mx-1" />
            <ModeToggle />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex p-1 bg-white/5 rounded-xl max-w-sm mx-auto">
          {(['chat', 'analise', 'graficos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize",
                viewMode === tab ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/70"
              )}
            >
              {tab === 'analise' ? 'Desempenho' : tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          {viewMode === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              <ScrollArea className="flex-1 px-4" ref={scrollRef}>
                <div className="max-w-3xl mx-auto py-8 space-y-6 pb-32">
                  {messages.length === 0 && !isLoadingHistory && (
                    <div className="text-center space-y-6 py-12">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block p-4 rounded-3xl bg-white/5 border border-white/10"
                      >
                        <Sparkles className="w-8 h-8 text-purple-400" />
                      </motion.div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold">Como posso elevar sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">produtividade</span> hoje?</h2>
                        <p className="text-white/40 text-sm">Eu analiso suas rotinas, dou dicas de foco e ajudo você a dominar seu tempo.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                        {QUICK_PROMPTS.map((qp, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(qp.prompt)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl text-left transition-all group active:scale-[0.98]"
                          >
                            <qp.icon className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-medium text-white/80">{qp.text}</p>
                            <p className="text-[10px] text-white/40 mt-1">Sugerido por INOVAPRO</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isLoadingHistory && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                      <p className="text-white/40 text-xs tracking-widest uppercase">Sincronizando Histórico...</p>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn(
                        "flex items-start gap-4",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1",
                        msg.role === 'user' ? "bg-white/10 border border-white/10" : "bg-purple-600 shadow-lg shadow-purple-600/20"
                      )}>
                        {msg.role === 'user' ? <div className="text-[10px] font-bold">VOCÊ</div> : <Brain className="w-4 h-4 text-white" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed relative group",
                        msg.role === 'user'
                          ? "bg-white/5 border border-white/10 rounded-tr-none text-white/90"
                          : "bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-tl-none text-purple-50/90"
                      )}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <span className="absolute bottom-[-20px] left-0 text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-5 py-3">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Control */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pb-10">
                <div className="max-w-2xl mx-auto relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Fale com a INOVAPRO..."
                      className="bg-white/5 border border-white/10 rounded-2xl pr-12 min-h-[56px] py-4 focus-visible:ring-purple-500/50 resize-none overflow-hidden"
                      rows={1}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/40">
                        <span>ENT</span>
                      </kbd>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    disabled={!inputValue.trim() || isLoading}
                    onClick={() => sendMessage()}
                    className="h-14 w-14 rounded-2xl bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/20 active:scale-95 transition-all flex-shrink-0"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : viewMode === 'analise' ? (
            <motion.div
              key="analise"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <RoutineAnalytics userMatricula={user.userId} />
            </motion.div>
          ) : (
            <motion.div
              key="graficos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <ProductivityCharts userMatricula={user.userId} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
