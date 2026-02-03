import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function MercadoLivreCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      exchangeToken(code);
    } else {
      setStatus('error');
      toast({ title: "Erro", description: "Código de autorização não encontrado.", variant: "destructive" });
    }
  }, []);

  const exchangeToken = async (code: string) => {
    try {
      const redirectUri = import.meta.env.VITE_MELI_REDIRECT_URI || `${window.location.origin}/integrations/callback`;
      
      const { data, error } = await supabase.functions.invoke('mercado-livre-auth', {
        body: { code, redirect_uri: redirectUri }
      });

      if (error) throw error;

      setStatus('success');
      toast({ title: "Sucesso", description: "Conta Mercado Livre conectada!" });
      
      setTimeout(() => {
        navigate('/settings');
      }, 2000);
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      toast({ 
        title: "Erro na conexão", 
        description: error.message || "Falha ao conectar com Mercado Livre.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center">Conexão Mercado Livre</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p>Conectando sua conta...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-green-700 font-medium">Conectado com sucesso!</p>
              <p className="text-sm text-gray-500 mt-2">Redirecionando...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-700 font-medium">Falha na conexão</p>
              <button 
                onClick={() => navigate('/settings')}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Voltar para Configurações
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
