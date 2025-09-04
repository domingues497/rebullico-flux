import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockMovement {
  id: string;
  product_variant_id: string;
  tipo_movimento: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  observacoes?: string;
  created_at: string;
}

export const useStock = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addStock = async (
    variantId: string, 
    quantity: number, 
    observations?: string
  ) => {
    setLoading(true);
    try {
      // Create stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_variant_id: variantId,
          tipo_movimento: 'entrada' as const,
          quantidade: quantity,
          observacoes: observations || 'Entrada manual de estoque'
        }]);

      if (movementError) throw movementError;

      // Update variant stock
      const { error: updateError } = await supabase.rpc(
        'update_stock_on_entry',
        {
          p_variant_id: variantId,
          p_quantity: quantity
        }
      );

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: `${quantity} unidades adicionadas ao estoque`
      });

    } catch (error: any) {
      console.error('Error adding stock:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar estoque",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeStock = async (
    variantId: string, 
    quantity: number, 
    observations?: string
  ) => {
    setLoading(true);
    try {
      // Create stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_variant_id: variantId,
          tipo_movimento: 'saida' as const,
          quantidade: quantity,
          observacoes: observations || 'Saída manual de estoque'
        }]);

      if (movementError) throw movementError;

      // Update variant stock using existing function
      const { error: updateError } = await supabase.rpc(
        'update_stock_on_sale',
        {
          p_variant_id: variantId,
          p_quantity: quantity
        }
      );

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: `${quantity} unidades removidas do estoque`
      });

    } catch (error: any) {
      console.error('Error removing stock:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover estoque",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (
    variantId: string, 
    newQuantity: number, 
    observations?: string
  ) => {
    setLoading(true);
    try {
      // Get current stock
      const { data: variant, error: fetchError } = await supabase
        .from('product_variants')
        .select('estoque_atual')
        .eq('id', variantId)
        .single();

      if (fetchError) throw fetchError;

      const currentStock = variant.estoque_atual;
      const difference = newQuantity - currentStock;

      if (difference === 0) {
        toast({
          title: "Info",
          description: "O estoque já está no valor desejado"
        });
        return;
      }

      // Create stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_variant_id: variantId,
          tipo_movimento: 'ajuste' as const,
          quantidade: Math.abs(difference),
          observacoes: observations || `Ajuste de estoque: ${currentStock} → ${newQuantity}`
        }]);

      if (movementError) throw movementError;

      // Update variant stock directly
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ estoque_atual: newQuantity })
        .eq('id', variantId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: `Estoque ajustado para ${newQuantity} unidades`
      });

    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao ajustar estoque",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStockHistory = async (variantId: string, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product_variants!inner(
            sku,
            products!inner(nome)
          )
        `)
        .eq('product_variant_id', variantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching stock history:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de estoque",
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    loading,
    addStock,
    removeStock,
    adjustStock,
    getStockHistory
  };
};