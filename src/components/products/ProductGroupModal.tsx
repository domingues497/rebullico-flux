import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  onSuccess?: () => void;
}

export const ProductGroupModal = ({ open, onOpenChange, groupId, onSuccess }: ProductGroupModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    estoque_minimo_default: 0
  });

  const isEdit = Boolean(groupId);

  useEffect(() => {
    if (open && groupId) {
      fetchGroup();
    } else if (open && !groupId) {
      resetForm();
    }
  }, [open, groupId]);

  const fetchGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome,
        estoque_minimo_default: data.estoque_minimo_default || 0
      });
    } catch (error: any) {
      console.error('Error fetching group:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o grupo",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      estoque_minimo_default: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('product_groups')
          .update(formData)
          .eq('id', groupId);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Grupo atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('product_groups')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Grupo criado com sucesso"
        });
      }

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving group:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar grupo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Grupo' : 'Novo Grupo de Produtos'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Grupo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Camisetas"
              required
            />
          </div>

          <div>
            <Label htmlFor="estoque_minimo_default">Estoque Mínimo Padrão</Label>
            <Input
              id="estoque_minimo_default"
              type="number"
              min="0"
              value={formData.estoque_minimo_default}
              onChange={(e) => setFormData({ ...formData, estoque_minimo_default: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Este valor será usado como padrão para novos produtos deste grupo
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="btn-pos-primary">
              {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar Grupo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};