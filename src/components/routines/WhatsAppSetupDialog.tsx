import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Phone, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WhatsAppSetupDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    onSuccess: () => void;
}

export function WhatsAppSetupDialog({
    isOpen,
    onClose,
    userId,
    userName: initialUserName,
    onSuccess
}: WhatsAppSetupDialogProps) {
    const [name, setName] = useState(initialUserName);
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !phone.trim()) {
            toast.error('Por favor, preencha todos os campos.');
            return;
        }

        // Format phone
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length < 10) {
            toast.error('Número de WhatsApp inválido.');
            return;
        }

        if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
        }

        setIsSubmitting(true);
        try {
            const { error } = await (supabase as any)
                .from('user_whatsapp_settings')
                .upsert({
                    user_matricula: parseInt(userId),
                    name: name,
                    whatsapp_number: formattedPhone,
                    enabled: true
                }, { onConflict: 'user_matricula' });

            if (error) throw error;

            toast.success('Notificações WhatsApp ativadas!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving WhatsApp settings:', error);
            toast.error('Erro ao salvar configurações: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <DialogTitle>Ativar Notificações WhatsApp</DialogTitle>
                    </div>
                    <DialogDescription>
                        Receba lembretes automáticos 15 minutos antes de cada rotina e evento da sua agenda.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Seu Nome</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Como quer ser chamado?"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="whatsapp">Número do WhatsApp (com DDD)</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="whatsapp"
                                className="pl-9"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Ex: 11999999999"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Não esqueça o DDD. O DDI +55 será adicionado automaticamente.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        className="w-full flex items-center gap-2"
                        onClick={handleSave}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Salvando...' : (
                            <>
                                <Save className="w-4 h-4" />
                                💾 Salvar e ativar notificações
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
