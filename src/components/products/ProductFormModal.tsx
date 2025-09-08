import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Upload, Image, Link as LinkIcon, Info } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  mode: 'create' | 'edit' | 'view';
}

interface VariantForm {
  id?: string;
  sku: string;
  ean: string;
  tamanho: string;
  cor: string;
  preco_base: number;
  estoque_atual: number;
  estoque_minimo: number;
}

export const ProductFormModal = ({ open, onOpenChange, productId, mode }: ProductFormModalProps) => {
  const { groups, createProduct, updateProduct, createVariant, uploadProductImage, addProductImageUrl } = useProducts();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cod_fabricante: '',
    ean_default: '',
    grupo_id: ''
  });

  const [variants, setVariants] = useState<VariantForm[]>([{
    sku: '',
    ean: '',
    tamanho: '',
    cor: '',
    preco_base: 0,
    estoque_atual: 0,
    estoque_minimo: 0
  }]);

  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const isReadonly = mode === 'view';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadonly) return;

    setLoading(true);
    try {
      // Create or update product
      let product;
      if (mode === 'create') {
        product = await createProduct(formData);
      } else {
        product = await updateProduct(productId!, formData);
      }

      // Create variants for new products
      if (mode === 'create' && product) {
        for (const variant of variants) {
          await createVariant({
            ...variant,
            product_id: product.id
          });
        }

        // Upload file images
        for (let i = 0; i < images.length; i++) {
          await uploadProductImage(product.id, images[i], i === 0 && imageUrls.length === 0);
        }

        // Add URL images
        for (let i = 0; i < imageUrls.length; i++) {
          await addProductImageUrl(product.id, imageUrls[i], i === 0 && images.length === 0);
        }
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      cod_fabricante: '',
      ean_default: '',
      grupo_id: ''
    });
    setVariants([{
      sku: '',
      ean: '',
      tamanho: '',
      cor: '',
      preco_base: 0,
      estoque_atual: 0,
      estoque_minimo: 0
    }]);
    setImages([]);
    setImageUrls([]);
    setCurrentImageUrl('');
  };

  const addVariant = () => {
    setVariants([...variants, {
      sku: '',
      ean: '',
      tamanho: '',
      cor: '',
      preco_base: 0,
      estoque_atual: 0,
      estoque_minimo: 0
    }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const addImageUrl = () => {
    if (currentImageUrl.trim()) {
      setImageUrls([...imageUrls, currentImageUrl.trim()]);
      setCurrentImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (open && mode === 'create') {
      resetForm();
    }
  }, [open, mode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Novo Produto'}
            {mode === 'edit' && 'Editar Produto'}
            {mode === 'view' && 'Visualizar Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Camiseta Polo"
                  required
                  disabled={isReadonly}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do produto"
                  disabled={isReadonly}
                />
              </div>

              <div>
                <Label htmlFor="cod_interno">Código Interno</Label>
                <Input
                  id="cod_interno"
                  value="Será gerado automaticamente"
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O código será gerado automaticamente no formato COD000001
                </p>
              </div>

              <div>
                <Label htmlFor="cod_fabricante">Código do Fabricante</Label>
                <Input
                  id="cod_fabricante"
                  value={formData.cod_fabricante}
                  onChange={(e) => setFormData({ ...formData, cod_fabricante: e.target.value })}
                  placeholder="FAB123"
                  disabled={isReadonly}
                />
              </div>

              <div>
                <Label htmlFor="ean_default">EAN Padrão</Label>
                <Input
                  id="ean_default"
                  value={formData.ean_default}
                  onChange={(e) => setFormData({ ...formData, ean_default: e.target.value })}
                  placeholder="7894900011517"
                  disabled={isReadonly}
                />
              </div>

              <div>
                <Label htmlFor="grupo_id">Grupo</Label>
                <Select
                  value={formData.grupo_id}
                  onValueChange={(value) => setFormData({ ...formData, grupo_id: value })}
                  disabled={isReadonly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Variantes */}
          {mode === 'create' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Variantes do Produto</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cada variante tem estoque independente (por cor, tamanho, etc.)
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Variante
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Como funciona:</strong> Cada variante (ex: Camiseta Azul P, Camiseta Vermelha M) 
                    terá seu próprio estoque. O estoque NÃO é somado entre variantes.
                  </AlertDescription>
                </Alert>
                {variants.map((variant, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">Variante {index + 1}</Badge>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>SKU *</Label>
                        <Input
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          placeholder="SKU001"
                          required
                        />
                      </div>
                      <div>
                        <Label>EAN</Label>
                        <Input
                          value={variant.ean}
                          onChange={(e) => updateVariant(index, 'ean', e.target.value)}
                          placeholder="7894900011517"
                        />
                      </div>
                      <div>
                        <Label>Tamanho</Label>
                        <Input
                          value={variant.tamanho}
                          onChange={(e) => updateVariant(index, 'tamanho', e.target.value)}
                          placeholder="M"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Cor</Label>
                        <Input
                          value={variant.cor}
                          onChange={(e) => updateVariant(index, 'cor', e.target.value)}
                          placeholder="Azul"
                        />
                      </div>
                      <div>
                        <Label>Preço Base *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.preco_base}
                          onChange={(e) => updateVariant(index, 'preco_base', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          required
                        />
                      </div>
                      <div>
                        <Label>Estoque Atual</Label>
                        <Input
                          type="number"
                          value={variant.estoque_atual}
                          onChange={(e) => updateVariant(index, 'estoque_atual', parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Estoque Mínimo</Label>
                        <Input
                          type="number"
                          value={variant.estoque_minimo}
                          onChange={(e) => updateVariant(index, 'estoque_minimo', parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upload de Imagens */}
          {mode === 'create' && (
            <Card>
              <CardHeader>
                <CardTitle>Imagens do Produto</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adicione imagens por upload de arquivo ou inserindo URLs
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload de Arquivo
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link da Imagem
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div>
                      <Label htmlFor="images">Selecionar Imagens</Label>
                      <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="cursor-pointer"
                      />
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((file, index) => (
                          <div key={index} className="relative">
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-center mt-2 truncate">
                              {file.name}
                            </p>
                            {index === 0 && imageUrls.length === 0 && (
                              <Badge className="absolute -top-2 -right-2" variant="secondary">
                                Principal
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Label htmlFor="imageUrl">URL da Imagem</Label>
                        <Input
                          id="imageUrl"
                          value={currentImageUrl}
                          onChange={(e) => setCurrentImageUrl(e.target.value)}
                          placeholder="https://exemplo.com/imagem.jpg"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" onClick={addImageUrl} disabled={!currentImageUrl.trim()}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {imageUrls.length > 0 && (
                      <div className="space-y-2">
                        <Label>URLs Adicionadas:</Label>
                        {imageUrls.map((url, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                            <div className="flex-1">
                              <p className="text-sm truncate">{url}</p>
                              {index === 0 && images.length === 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Principal
                                </Badge>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImageUrl(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isReadonly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!isReadonly && (
              <Button type="submit" disabled={loading} className="btn-pos-primary">
                {loading ? 'Salvando...' : mode === 'create' ? 'Criar Produto' : 'Salvar Alterações'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};