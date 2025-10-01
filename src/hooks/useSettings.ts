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
    if (!settings) return;
    
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

export type { Settings };
