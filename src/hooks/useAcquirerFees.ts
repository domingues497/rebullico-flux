import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAcquirerFees = () => {
  const queryClient = useQueryClient();

  const { data: acquirerFees, isLoading } = useQuery({
    queryKey: ['acquirer-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acquirer_fees')
        .select('*')
        .order('bandeira', { ascending: true })
        .order('parcelas', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newFee: any) => {
      const { data, error } = await supabase
        .from('acquirer_fees')
        .insert(newFee)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquirer-fees'] });
      toast.success('Taxa de bandeira criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar taxa: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('acquirer_fees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquirer-fees'] });
      toast.success('Taxa atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar taxa: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('acquirer_fees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquirer-fees'] });
      toast.success('Taxa excluída com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir taxa: ' + error.message);
    },
  });

  return {
    acquirerFees,
    isLoading,
    createAcquirerFee: createMutation.mutate,
    updateAcquirerFee: updateMutation.mutate,
    deleteAcquirerFee: deleteMutation.mutate,
  };
};
