import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function MercadoLivreConnect() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [integrationData, setIntegrationData] = useState<any>(null);

  // Check status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setConnected(true);
        setIntegrationData(data);
      } else {
        setConnected(false);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      // You should set VITE_MELI_APP_ID in your .env
      const appId = import.meta.env.VITE_MELI_APP_ID; 
      const redirectUri = `${window.location.origin}/integrations/callback`;
      
      if (!appId) {
        toast({
          title: "Configuração ausente",
          description: "VITE_MELI_APP_ID não configurado.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      // Redirect to ML Auth
      window.location.href = authUrl;
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Mercado Livre
          {connected && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Conecte sua conta para publicar produtos e sincronizar estoque.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
              <CheckCircle className="h-4 w-4" />
              <span>Conta conectada com sucesso!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Última atualização: {new Date(integrationData?.updated_at).toLocaleString()}
            </p>
            <Button variant="outline" size="sm" onClick={() => {
                // Implement disconnect/delete integration logic if needed
                toast({ title: "Desconexão não implementada ainda" });
            }}>
              Desconectar
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnect} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Conectar conta Mercado Livre
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
