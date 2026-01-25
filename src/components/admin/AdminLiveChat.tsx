import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  X
} from "lucide-react";

interface ChatSession {
  id: string;
  user_matricula: number;
  user_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: string;
  sender_id: string | null;
  message: string;
  is_ai: boolean;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  waiting: { label: 'Aguardando', color: 'bg-amber-500', icon: Clock },
  active: { label: 'Em Atendimento', color: 'bg-emerald-500', icon: MessageCircle },
  closed: { label: 'Encerrado', color: 'bg-slate-500', icon: CheckCircle2 },
};

export function AdminLiveChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load sessions
  useEffect(() => {
    loadSessions();
    
    // Subscribe to new sessions
    const channel = supabase
      .channel('admin_live_chat')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_chat_sessions' },
        () => {
          loadSessions();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Notification for new user messages
          if (newMsg.sender_type === 'user') {
            toast({
              title: "Nova mensagem!",
              description: "Um cliente enviou uma mensagem.",
            });
            // Reload sessions to update unread count
            loadSessions();
          }
          // Update messages if viewing this session
          if (selectedSession && newMsg.session_id === selectedSession.id) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const selectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    await loadMessages(session.id);
    
    // Update status to active if waiting
    if (session.status === 'waiting') {
      await supabase
        .from('live_chat_sessions')
        .update({ status: 'active' })
        .eq('id', session.id);
      loadSessions();
    }
  };

  const sendMessage = async () => {
    if (!selectedSession || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          session_id: selectedSession.id,
          sender_type: 'admin',
          message: newMessage.trim(),
          is_ai: false
        });

      if (error) throw error;

      // Update session
      await supabase
        .from('live_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedSession.id);

      setNewMessage('');
      await loadMessages(selectedSession.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const closeSession = async (sessionId: string) => {
    try {
      await supabase
        .from('live_chat_sessions')
        .update({ status: 'closed', ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
      loadSessions();
      toast({ title: "Atendimento encerrado" });
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Hoje ${formatTime(dateStr)}`;
    }
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Count waiting sessions for notification
  const waitingCount = sessions.filter(s => s.status === 'waiting').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with notification */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Chat ao Vivo
          </h2>
          <p className="text-slate-400 text-sm">Atendimento em tempo real com clientes</p>
        </div>
        {waitingCount > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            <Bell className="w-3 h-3 mr-1" />
            {waitingCount} aguardando
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Sessions List */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-1 p-2">
                {sessions.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">
                    Nenhum atendimento no momento
                  </p>
                ) : (
                  sessions.map((session) => {
                    const config = statusConfig[session.status] || statusConfig.waiting;
                    const StatusIcon = config.icon;
                    const isSelected = selectedSession?.id === session.id;
                    
                    return (
                      <motion.div
                        key={session.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => selectSession(session)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/20 border border-primary/40' 
                            : 'bg-slate-700/50 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white text-sm truncate">
                            {session.user_name || `#${session.user_matricula}`}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${config.color}`} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {formatDate(session.created_at)}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2 flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">
                        {selectedSession.user_name || `Usuário #${selectedSession.user_matricula}`}
                      </CardTitle>
                      <p className="text-xs text-slate-400">
                        Matrícula: {selectedSession.user_matricula}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedSession.status !== 'closed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => closeSession(selectedSession.id)}
                        className="text-slate-400 border-slate-600"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Encerrar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.sender_type === 'admin' 
                            ? 'bg-primary text-primary-foreground rounded-br-md' 
                            : msg.is_ai
                            ? 'bg-slate-600 rounded-bl-md'
                            : 'bg-slate-700 rounded-bl-md'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-medium opacity-70">
                            {msg.sender_type === 'admin' ? 'Você' : msg.is_ai ? 'IA' : 'Cliente'}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-[10px] mt-1 opacity-60">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              {selectedSession.status !== 'closed' && (
                <div className="p-4 border-t border-slate-700">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="flex-1 bg-slate-700 border-slate-600 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione um atendimento para começar</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
