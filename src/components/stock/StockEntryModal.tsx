import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StockEntryItem {
  product_variant_id: string;
  quantidade: number;
  custo_unit: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>;
}

export function StockEntryModal({ open, onOpenChange, onSave }: Props) {
  const { toast } = useToast();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();

  const [numeroNota, setNumeroNota] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<StockEntryItem[]>([]);
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { product_variant_id: undefined as any, quantidade: 1, custo_unit: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof StockEntryItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnexoFile(e.target.files[0]);
    }
  };

  const uploadAnexo = async () => {
    if (!anexoFile) return null;

    try {
      setUploading(true);
      const fileExt = anexoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `notas-fiscais/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('attachments')
        .upload(filePath, anexoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao fazer upload do anexo',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (items.length === 0) {
        toast({
          title: 'Adicione produtos',
          description: 'É necessário adicionar ao menos um produto',
          variant: 'destructive',
        });
        return;
      }

      const invalidItems = items.filter(
        (item) => !item.product_variant_id || item.quantidade <= 0 || item.custo_unit <= 0
      );

      if (invalidItems.length > 0) {
        toast({
          title: 'Dados incompletos',
          description: 'Preencha todos os campos dos produtos',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      let anexo_url = null;
      if (anexoFile) {
        anexo_url = await uploadAnexo();
      }

      await onSave({
        numero_nota: numeroNota || undefined,
        supplier_id: supplierId || undefined,
        data,
        anexo_url,
        items,
      });

      // Resetar formulário
      setNumeroNota('');
      setSupplierId('');
      setData(new Date().toISOString().split('T')[0]);
      setItems([]);
      setAnexoFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + item.quantidade * item.custo_unit, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançar Nota Fiscal de Entrada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número da Nota</Label>
              <Input
                value={numeroNota}
                onChange={(e) => setNumeroNota(e.target.value)}
                placeholder="Ex: 12345"
              />
            </div>

            <div>
              <Label>Data da Entrada</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Fornecedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Anexar Nota Fiscal (PDF, Imagem)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
              {anexoFile && (
                <span className="text-sm text-muted-foreground">{anexoFile.name}</span>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <Label className="text-lg">Produtos</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Produto
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum produto adicionado
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs">Produto</Label>
                      <Select
                        value={item.product_variant_id || undefined}
                        onValueChange={(val) => updateItem(index, 'product_variant_id', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.nome} - {variant.sku}
                              {variant.cor && ` - ${variant.cor}`}
                              {variant.tamanho && ` - ${variant.tamanho}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) =>
                          updateItem(index, 'quantidade', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Custo Unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.custo_unit}
                        onChange={(e) =>
                          updateItem(index, 'custo_unit', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex justify-between items-center">
            <div className="text-lg font-semibold">
              Total: R$ {total.toFixed(2)}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading || uploading}>
                {loading ? 'Salvando...' : uploading ? 'Enviando anexo...' : 'Registrar Entrada'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
