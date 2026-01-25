import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Link2,
  Copy,
  CheckCircle,
  Share2
} from "lucide-react";

export function AdminAffiliatesPanel() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Link fixo para convite de afiliados com código INV-ADMIN
  const affiliateSignupLink = `${window.location.origin}/affiliate-signup?ref=INV-ADMIN`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(affiliateSignupLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Torne-se um Afiliado INOVAFINANCE',
          text: 'Cadastre-se como afiliado e ganhe comissões de 50% em cada indicação!',
          url: affiliateSignupLink,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Sistema de Afiliados</h1>
        <p className="text-muted-foreground">Compartilhe o link abaixo para convidar pessoas a se tornarem afiliados</p>
      </motion.div>

      {/* Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/80 border-border">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg text-foreground">Link de Convite para Afiliados</CardTitle>
            <CardDescription className="text-muted-foreground">
              Envie este link para pessoas que desejam se tornar afiliados e ganhar 50% de comissão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Link Display */}
            <div className="relative">
              <Input
                value={affiliateSignupLink}
                readOnly
                className="pr-24 bg-background/50 border-border text-primary font-mono text-sm h-12"
              />
              <Button
                onClick={handleCopy}
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>

            {/* Share Button */}
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full h-12 border-border"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar Link
            </Button>

            {/* Info Box */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-4">
              <h4 className="text-primary font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Como funciona
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Compartilhe o link acima com potenciais afiliados</li>
                <li>• Eles se cadastram através do formulário de afiliado</li>
                <li>• Após aprovação, recebem seu link único de indicação</li>
                <li>• Ganham 50% de comissão em cada assinatura vendida</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
