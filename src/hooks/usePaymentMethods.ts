import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePaymentMethods = () => {
  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newMethod: any) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert(newMethod)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Forma de pagamento criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar forma de pagamento: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Forma de pagamento atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar forma de pagamento: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Forma de pagamento excluída com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir forma de pagamento: ' + error.message);
    },
  });

  return {
    paymentMethods,
    isLoading,
    createPaymentMethod: createMutation.mutate,
    updatePaymentMethod: updateMutation.mutate,
    deletePaymentMethod: deleteMutation.mutate,
  };
};
