import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Settings {
  id: string;
  store_name: string;
  store_cnpj: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  
  // POS Configuration
  enable_rounding_to_05: boolean;
  allow_price_edit_seller: boolean;
  auto_print_receipt: boolean;
  receipt_footer: string;
  
  // Financial Settings
  default_tax_rate: number;
  currency_symbol: string;
  
  // Inventory Settings
  low_stock_alert: boolean;
  low_stock_threshold: number;
  auto_update_stock: boolean;
  track_inventory: boolean;
  
  // System Settings
  auto_backup: boolean;
  backup_frequency_days: number;
  theme: string;
  language: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

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
        .single();

      if (error) {
        // Se não existir nenhum registro, cria um padrão
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('settings')
            .insert({
              nome: 'Minha Loja',
              cnpj: '',
              endereco: '',
              telefone: null
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newData);
        } else {
          throw error;
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

  const getSetting = (key: keyof Omit<Settings, 'id' | 'created_at' | 'updated_at'>) => {
    return settings ? settings[key] : null;
  };

  const updateSettings = async (updates: Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!settings) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data);
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso"
      });

      return data;
    } catch (error: unknown) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações",
        variant: "destructive"
      });
      throw error;
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