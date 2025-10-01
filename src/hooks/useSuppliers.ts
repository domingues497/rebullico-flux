import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  nome: string;
  cnpj_cpf?: string;
  contato?: any; // Json type from database
  created_at: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('nome');

      if (error) throw error;

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os fornecedores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: { nome: string; cnpj_cpf?: string; contato?: any }) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso"
      });

      await fetchSuppliers();
      return data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o fornecedor",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateSupplier = async (id: string, supplierData: { nome?: string; cnpj_cpf?: string; contato?: any }) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso"
      });

      await fetchSuppliers();
      return data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o fornecedor",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor removido com sucesso"
      });

      await fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o fornecedor",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
};