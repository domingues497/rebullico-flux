import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ProductData {
  id: string;
  nome: string;
  descricao?: string;
  preco_base?: number;
  estoque_atual?: number;
  tamanho?: string;
  cor?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductData | null;
}

export function MercadoLivrePublishModal({ open, onOpenChange, product }: Props) {
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [availableQuantity, setAvailableQuantity] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [picturesText, setPicturesText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setTitle(product.nome || '');
      setPrice(product.preco_base || 0);
      setAvailableQuantity(product.estoque_atual || 1);
      setDescription(product.descricao || '');
    }
  }, [product]);

  const handlePublish = async () => {
    try {
      setLoading(true);
      if (!title || !categoryId || !price) {
        toast({ title: 'Campos obrigatórios', description: 'Informe título, categoria e preço', variant: 'destructive' });
        return;
      }

      const pictures = picturesText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const attributes = [] as Array<{ id: string; value_name: string }>;
      if (product?.cor) attributes.push({ id: 'COLOR', value_name: product.cor });
      if (product?.tamanho) attributes.push({ id: 'SIZE', value_name: product.tamanho });

      const { data, error } = await supabase.functions.invoke('mercado-livre-publish', {
        body: {
          title,
          category_id: categoryId,
          price,
          currency_id: 'BRL',
          available_quantity: availableQuantity,
          buying_mode: 'buy_it_now',
          listing_type_id: 'gold_special',
          condition: 'new',
          description,
          pictures,
          attributes,
        },
      });

      if (error) throw error;

      toast({ title: 'Publicado com sucesso', description: `Item criado: ${data?.item?.id || ''}` });
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro ao publicar', description: e?.message || 'Falha na publicação', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publicar no Mercado Livre</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>ID da Categoria (MLB...)</Label>
            <Input value={categoryId} onChange={e => setCategoryId(e.target.value)} placeholder="Ex.: MLB3530" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preço (BRL)</Label>
              <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" value={availableQuantity} onChange={e => setAvailableQuantity(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>URLs das fotos (uma por linha)</Label>
            <textarea className="w-full border rounded p-2 h-24" value={picturesText} onChange={e => setPicturesText(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={handlePublish} disabled={loading}>{loading ? 'Publicando...' : 'Publicar'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}