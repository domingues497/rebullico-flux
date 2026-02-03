import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Settings, SettingsUpdate } from '@/types/settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      // Se não existir configuração, criar uma padrão
      if (!data) {
        // Verificar se usuário está autenticado antes de tentar criar
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: newData, error: insertError } = await supabase
            .from('settings')
            .insert({
              store_name: 'Rebulliço',
              store_cnpj: '',
              store_address: 'Rua da Moda, 123 - Centro',
              store_phone: '(11) 99999-9999',
              store_email: ''
            } as any)
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newData);
        } else {
          console.log('Settings not found and user not authenticated. Using defaults.');
          // Fallback defaults for unauthenticated users to avoid RLS error
          setSettings({
            id: 'default',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            store_name: 'Rebulliço',
            store_cnpj: '',
            store_address: 'Rua da Moda, 123 - Centro',
            store_phone: '(11) 99999-9999',
            store_email: '',
            enable_rounding_to_05: true,
            allow_price_edit_seller: false,
            auto_print_receipt: true,
            receipt_footer: 'Obrigado pela preferência! Trocas em até 7 dias.',
            default_tax_rate: 0,
            currency_symbol: 'R$',
            low_stock_alert: true,
            low_stock_threshold: 10,
            auto_update_stock: true,
            track_inventory: true,
            auto_backup: false,
            backup_frequency_days: 7,
            theme: 'light',
            language: 'pt-BR'
          });
        }
      } else {
        setSettings(data);
      }
    } catch (error: unknown) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSetting = <K extends keyof Settings>(key: K): Settings[K] | null => {
    return settings ? settings[key] : null;
  };

  const updateSettings = async (updates: SettingsUpdate) => {
    if (!settings) return false;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .update(updates as any)
        .eq('id', settings.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setSettings(data);
      return true;
    } catch (error: unknown) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    fetchSettings,
    getSetting,
    updateSettings
  };
};

export type { Settings };
