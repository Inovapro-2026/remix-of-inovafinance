import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User as UserIcon,
  HeadphonesIcon,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'admin';
  content: string;
  timestamp: Date;
  isAI?: boolean;
}

type ChatMode = 'ai' | 'human' | 'waiting';

export function SupportChatPopout() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('ai');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to live chat messages when in human mode
  useEffect(() => {
    if (!sessionId || chatMode !== 'human') return;

    const channel = supabase
      .channel(`live_chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_type === 'admin') {
            setMessages(prev => [...prev, {
              id: newMsg.id,
              role: 'admin',
              content: newMsg.message,
              timestamp: new Date(newMsg.created_at),
              isAI: false
            }]);
            // Update mode to human if was waiting
            setChatMode('human');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, chatMode]);

  // Load initial message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! 👋 Sou a INOVA, assistente virtual do INOVAFINANCE. Como posso ajudar você hoje?\n\nPosso responder dúvidas sobre:\n• Funcionalidades do app\n• Planos e assinatura\n• Cartão de crédito\n• Rotinas e produtividade\n• Programa de afiliados\n\nSe precisar de atendimento humano, é só clicar no botão abaixo! 💬',
        timestamp: new Date(),
        isAI: true
      }]);
    }
  }, [isOpen]);

  const sendToAI = async (userMessage: string) => {
    try {
      const history = messages.map(m => ({
        role: m.role === 'admin' ? 'assistant' : m.role,
        content: m.content
      }));

      const response = await supabase.functions.invoke('support-ai-chat', {
        body: { message: userMessage, history }
      });

      if (response.error) throw response.error;

      return response.data.message || response.data.fallback;
    } catch {
      return 'Desculpe, estou com dificuldades no momento. Que tal tentar o atendimento humano? 🙏';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    if (chatMode === 'ai') {
      // AI mode - send to AI function
      setIsLoading(true);
      try {
        const aiResponse = await sendToAI(userMessage);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          isAI: true
        }]);
      } catch (error) {
        toast.error('Erro ao processar mensagem');
      } finally {
        setIsLoading(false);
      }
    } else if (chatMode === 'human' && sessionId) {
      // Human mode - send to database
      try {
        await supabase.from('live_chat_messages').insert({
          session_id: sessionId,
          sender_type: 'user',
          sender_id: user?.id || null,
          message: userMessage
        });
      } catch (error) {
        toast.error('Erro ao enviar mensagem');
      }
    }
  };

  const requestHumanSupport = async () => {
    if (!user || !user.userId) {
      toast.error('Você precisa estar logado para falar com um atendente');
      return;
    }

    setIsLoading(true);
    try {
      // Create live chat session using user_matricula (number)
      const { data: session, error } = await supabase
        .from('live_chat_sessions')
        .insert({
          user_matricula: user.userId,
          user_name: user.fullName || 'Usuário',
          status: 'waiting'
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!session) {
        throw new Error('Sessão não foi criada');
      }

      setSessionId(session.id);
      setChatMode('waiting');

      // Add system message
      setMessages(prev => [...prev, {
        id: 'human-request',
        role: 'assistant',
        content: '🔔 Solicitação de atendimento enviada!\n\nUm atendente será notificado e responderá em breve. Enquanto isso, você pode continuar descrevendo sua dúvida ou problema.\n\nHorário de atendimento:\nSeg-Sex: 9h às 18h\nSáb: 9h às 13h',
        timestamp: new Date(),
        isAI: true
      }]);

      toast.success('Atendente notificado! Aguarde...');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao solicitar atendimento: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const backToAI = () => {
    setChatMode('ai');
    setSessionId(null);
    setMessages(prev => [...prev, {
      id: 'back-to-ai',
      role: 'assistant',
      content: 'Voltou para o atendimento com IA! 🤖 Como posso ajudar?',
      timestamp: new Date(),
      isAI: true
    }]);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 flex items-center justify-center z-50"
        aria-label="Suporte"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        
        {/* Pulse effect */}
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      </motion.button>

      {/* Chat Popout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center gap-3">
                {chatMode !== 'ai' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={backToAI}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {chatMode === 'ai' ? (
                    <Bot className="w-5 h-5 text-primary" />
                  ) : (
                    <HeadphonesIcon className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {chatMode === 'ai' ? 'INOVA - Assistente IA' : 'Atendimento Humano'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {chatMode === 'ai' && 'Responde 24h'}
                    {chatMode === 'waiting' && '⏳ Aguardando atendente...'}
                    {chatMode === 'human' && '🟢 Atendente conectado'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-md' 
                          : msg.role === 'admin'
                          ? 'bg-emerald-500/20 text-foreground rounded-bl-md border border-emerald-500/30'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {msg.role !== 'user' && (
                        <div className="flex items-center gap-1.5 mb-1">
                          {msg.isAI ? (
                            <Bot className="w-3 h-3 text-primary" />
                          ) : (
                            <HeadphonesIcon className="w-3 h-3 text-emerald-500" />
                          )}
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {msg.isAI ? 'INOVA' : 'Atendente'}
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-60">
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Human Support Button */}
            {chatMode === 'ai' && (
              <div className="px-4 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-2 border-primary/30 hover:bg-primary/10"
                  onClick={requestHumanSupport}
                  disabled={isLoading}
                >
                  <HeadphonesIcon className="w-3.5 h-3.5" />
                  Falar com Atendente Humano
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[44px] max-h-[100px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-11 w-11"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
