import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Brand {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as marcas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async (brandData: { nome: string; descricao?: string }) => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert([brandData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Marca criada com sucesso"
      });

      await fetchBrands();
      return data;
    } catch (error) {
      console.error('Error creating brand:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a marca",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateBrand = async (id: string, brandData: { nome?: string; descricao?: string; ativo?: boolean }) => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .update(brandData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Marca atualizada com sucesso"
      });

      await fetchBrands();
      return data;
    } catch (error) {
      console.error('Error updating brand:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a marca",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteBrand = async (id: string) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Marca desativada com sucesso"
      });

      await fetchBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar a marca",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return {
    brands,
    loading,
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand
  };
};