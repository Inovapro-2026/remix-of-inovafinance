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
  Mic,
  MicOff,
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
import { parseAgendaCommand, isAgendaOrRoutineCommand, formatParsedEventForDisplay, type ParsedAgendaEvent } from '@/services/unifiedAgendaParser';
import { ConfirmAgendaPopout } from '@/components/ConfirmAgendaPopout';
import { saveUnifiedRoutine, formatSuccessMessage } from '@/services/saveUnifiedRoutine';

// Web Speech API types
interface ISpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

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

  // Unified parser popout state
  const [showConfirmPopout, setShowConfirmPopout] = useState(false);
  const [parsedEvent, setParsedEvent] = useState<ParsedAgendaEvent | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<ChatMessage | null>(null);

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

    // Check if this is an agenda/routine creation command
    if (isAgendaOrRoutineCommand(messageText)) {
      console.log('[INOVAPRO AI] Detected agenda/routine command, opening confirmation popout');
      
      // Parse the command using our unified parser
      const parsed = parseAgendaCommand(messageText, 'chat');
      console.log('[INOVAPRO AI] Parsed result:', parsed);
      
      // Create user message for display
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setPendingUserMessage(userMessage);
      
      // Show confirmation popout with pre-filled data
      setParsedEvent(parsed);
      setShowConfirmPopout(true);
      return;
    }

    // Normal chat flow for non-creation messages
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

      // 3. Call Routine AI Edge Function
      console.log('[INOVAPRO AI] Calling routine-ai-chat edge function...');

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('routine-ai-chat', {
        body: { message: messageText, history, userMatricula: user.userId }
      });

      if (edgeError) {
        console.error('[INOVAPRO AI] Edge function error:', edgeError);
        throw new Error('Falha na conexão com a IA. Tente novamente.');
      }

      if (edgeData?.error) {
        console.error('[INOVAPRO AI] API error:', edgeData.error);
        throw new Error(edgeData.error);
      }

      const aiResponse = edgeData?.message;
      if (!aiResponse) {
        throw new Error('Resposta vazia da IA');
      }

      handleAIResponse(aiResponse);

    } catch (err) {
      console.error('Error communicating with AI:', err);
      toast.error('Não consegui te responder agora. Tente novamente em instantes.');
      // Remove the optimistic message
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle popout confirmation - save to database
  const handlePopoutConfirm = async (event: ParsedAgendaEvent) => {
    if (!user) return;
    
    setIsSavingEvent(true);
    
    try {
      const result = await saveUnifiedRoutine(event, user.userId);
      
      if (result.success) {
        // Create AI response message
        const successMsg = formatSuccessMessage(event);
        
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: successMsg,
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Save messages to DB
        if (pendingUserMessage) {
          await supabase.from('routine_chat_messages').insert({
            user_matricula: user.userId,
            role: 'user',
            content: pendingUserMessage.content
          });
        }
        
        await supabase.from('routine_chat_messages').insert({
          user_matricula: user.userId,
          role: 'assistant',
          content: successMsg
        });
        
        toast.success('Salvo com sucesso!');
        
        if (isVoiceActive) {
          isaSpeak(`${event.tipo === 'rotina' ? 'Rotina' : 'Lembrete'} ${event.titulo} adicionado com sucesso.`, 'routine');
        }
        
        // Refresh notifications
        await routineNotificationService.scheduleRoutineAlerts(user.userId);
      } else {
        toast.error(result.error || 'Erro ao salvar');
      }
    } catch (err) {
      console.error('Error saving event:', err);
      toast.error('Erro ao salvar');
    } finally {
      setIsSavingEvent(false);
      setShowConfirmPopout(false);
      setParsedEvent(null);
      setPendingUserMessage(null);
    }
  };

  // Handle popout cancel
  const handlePopoutCancel = () => {
    setShowConfirmPopout(false);
    setParsedEvent(null);
    // Remove the pending user message if cancelled
    if (pendingUserMessage) {
      setMessages(prev => prev.filter(m => m.id !== pendingUserMessage.id));
    }
    setPendingUserMessage(null);
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

  // Voice recognition
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const startVoiceRecording = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error('Seu navegador não suporta reconhecimento de voz');
      return;
    }

    const recognition = new SpeechRecognitionAPI() as ISpeechRecognition;
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      toast.error('Erro no reconhecimento de voz');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  // UI Components
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 dark:bg-purple-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-600/10 blur-[120px] rounded-full" />

      {/* Header */}
      <header className="sticky top-0 z-50 p-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">INOVAPRO <span className="text-purple-500 dark:text-purple-400">AI</span></h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full transition-all", isVoiceActive ? "bg-purple-500/20 text-purple-500" : "text-muted-foreground")}
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              title={isVoiceActive ? "Desativar voz" : "Ativar voz da IA"}
            >
              {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full hover:bg-muted">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar conversa?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Isso apagará permanentemente todo o histórico deste chat.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-muted border-border hover:bg-muted/80">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Apagar Tudo</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="h-6 w-px bg-border mx-1" />
            <ModeToggle />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex p-1 bg-muted rounded-xl max-w-sm mx-auto">
          {(['chat', 'analise', 'graficos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize",
                viewMode === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === 'analise' ? 'Desempenho' : tab === 'graficos' ? 'Gráficos' : 'Chat'}
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
                <div className="max-w-3xl mx-auto py-8 space-y-6 pb-40">
                  {messages.length === 0 && !isLoadingHistory && (
                    <div className="text-center space-y-6 py-12">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block p-4 rounded-3xl bg-muted border border-border"
                      >
                        <Sparkles className="w-8 h-8 text-purple-500" />
                      </motion.div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold">Como posso elevar sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">produtividade</span> hoje?</h2>
                        <p className="text-muted-foreground text-sm">Eu analiso suas rotinas, dou dicas de foco e ajudo você a dominar seu tempo.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                        {QUICK_PROMPTS.map((qp, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(qp.prompt)}
                            className="bg-muted hover:bg-muted/80 border border-border p-4 rounded-2xl text-left transition-all group active:scale-[0.98]"
                          >
                            <qp.icon className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-medium">{qp.text}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Sugerido por INOVAPRO AI</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isLoadingHistory && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                      <p className="text-muted-foreground text-xs tracking-widest uppercase">Sincronizando Histórico...</p>
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
                        msg.role === 'user' ? "bg-muted border border-border" : "bg-purple-600 shadow-lg shadow-purple-600/20"
                      )}>
                        {msg.role === 'user' ? <div className="text-[10px] font-bold">VOCÊ</div> : <Brain className="w-4 h-4 text-white" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed relative group",
                        msg.role === 'user'
                          ? "bg-muted border border-border rounded-tr-none"
                          : "bg-purple-500/10 dark:bg-purple-500/20 backdrop-blur-md border border-purple-500/20 rounded-tl-none"
                      )}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <span className="absolute bottom-[-20px] left-0 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <div className="bg-muted border border-border rounded-2xl rounded-tl-none px-5 py-3">
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
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pb-24">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-2 shadow-lg">
                    {/* Voice Recording Button */}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      className={cn(
                        "h-10 w-10 rounded-xl transition-all flex-shrink-0",
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                      title={isRecording ? "Parar gravação" : "Gravar áudio"}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>

                    {/* Text Input */}
                    <div className="flex-1 relative">
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
                        placeholder={isRecording ? "Ouvindo..." : "Digite sua mensagem..."}
                        className="bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[40px] max-h-[120px] py-2 px-3 text-sm"
                        rows={1}
                        disabled={isRecording}
                      />
                    </div>

                    {/* Send Button */}
                    <Button
                      size="icon"
                      disabled={!inputValue.trim() || isLoading}
                      onClick={() => sendMessage()}
                      className="h-10 w-10 rounded-xl bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20 active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                  
                  {/* Recording indicator */}
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 mt-2 text-sm text-red-500"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span>Gravando... Clique no microfone para parar</span>
                    </motion.div>
                  )}
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

      {/* Confirmation Popout for Agenda/Routine creation */}
      <ConfirmAgendaPopout
        isOpen={showConfirmPopout}
        parsedEvent={parsedEvent}
        onConfirm={handlePopoutConfirm}
        onCancel={handlePopoutCancel}
        isLoading={isSavingEvent}
      />
    </div>
  );
}
