import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockEntry {
  id: string;
  numero_nota?: string;
  supplier_id?: string;
  data: string;
  total: number;
  anexo_url?: string;
  created_at: string;
  suppliers?: {
    nome: string;
  };
}

export interface StockEntryItem {
  id: string;
  entry_id: string;
  product_variant_id: string;
  quantidade: number;
  custo_unit: number;
  created_at: string;
}

export interface StockEntryCreate {
  numero_nota?: string;
  supplier_id?: string;
  data: string;
  anexo_url?: string;
  items: Array<{
    product_variant_id: string;
    quantidade: number;
    custo_unit: number;
  }>;
}

export function useStockEntries() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_entries')
        .select(`
          *,
          suppliers (nome)
        `)
        .order('data', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar entradas:', error);
      toast({
        title: 'Erro ao carregar entradas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (entryData: StockEntryCreate) => {
    try {
      setLoading(true);

      // Calcular total
      const total = entryData.items.reduce(
        (sum, item) => sum + item.quantidade * item.custo_unit,
        0
      );

      // Criar entrada
      const { data: entry, error: entryError } = await supabase
        .from('stock_entries')
        .insert({
          numero_nota: entryData.numero_nota,
          supplier_id: entryData.supplier_id,
          data: entryData.data,
          total,
          anexo_url: entryData.anexo_url,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Criar itens da entrada
      const items = entryData.items.map((item) => ({
        entry_id: entry.id,
        product_variant_id: item.product_variant_id,
        quantidade: item.quantidade,
        custo_unit: item.custo_unit,
      }));

      const { error: itemsError } = await supabase
        .from('stock_entry_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Atualizar estoque de cada produto usando a função do banco
      for (const item of entryData.items) {
        const { error: stockError } = await supabase.rpc('update_stock_on_entry', {
          p_variant_id: item.product_variant_id,
          p_quantity: item.quantidade,
        });

        if (stockError) {
          console.error('Erro ao atualizar estoque:', stockError);
          throw stockError;
        }
      }

      toast({
        title: 'Entrada registrada',
        description: 'Estoque atualizado com sucesso',
      });

      await fetchEntries();
      return entry;
    } catch (error: any) {
      console.error('Erro ao criar entrada:', error);
      toast({
        title: 'Erro ao registrar entrada',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getEntryDetails = async (entryId: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_entry_items')
        .select(`
          *,
          product_variants (
            sku,
            cor,
            tamanho,
            products (nome)
          )
        `)
        .eq('entry_id', entryId);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Erro ao buscar itens da entrada:', error);
      toast({
        title: 'Erro ao carregar itens',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return {
    entries,
    loading,
    fetchEntries,
    createEntry,
    getEntryDetails,
  };
}
