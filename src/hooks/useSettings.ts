import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Setting {
  id: string;
  chave: string;
  valor: any;
  created_at: string;
  updated_at: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('settings', {
        method: 'GET'
      });

      if (error) throw error;
      setSettings(data.data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSetting = async (key: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;
      return data.data?.find((s: Setting) => s.chave === key)?.valor;
    } catch (error: any) {
      console.error('Error getting setting:', error);
      return null;
    }
  };

  const createSetting = async (chave: string, valor: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('settings', {
        method: 'POST',
        body: { chave, valor }
      });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Configuração criada com sucesso"
      });

      await fetchSettings();
      return data.data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar configuração",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (chave: string, valor: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('settings', {
        method: 'PUT',
        body: { valor },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso"
      });

      await fetchSettings();
      return data.data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar configuração",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteSetting = async (chave: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('settings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Configuração removida com sucesso"
      });

      await fetchSettings();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover configuração",
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
    createSetting,
    updateSetting,
    deleteSetting
  };
}