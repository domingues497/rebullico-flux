import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  mode: 'create' | 'edit' | 'view';
  initialSku?: string;
  initialEan?: string;
  onSuccess?: () => void; // Callback para quando o produto for salvo com sucesso
}

interface VariantForm {
  id?: string;
  sku: string;
  ean: string;
  cod_fabricante: string;
  tamanho: string;
  cor: string;
  preco_custo: number;
  margem_lucro: number;
  preco_base: number;
  estoque_atual: number;
  estoque_minimo: number;
}

export const ProductFormModal = ({ open, onOpenChange, productId, mode, initialSku, initialEan, onSuccess }: ProductFormModalProps) => {
  const { toast } = useToast();
  const { groups, createProduct, updateProduct, createVariant, updateVariant: updateVariantAPI, uploadProductImage, addProductImageUrl, getProduct } = useProducts();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    codigo_interno: '',
    grupo_id: ''
  });

  const [variants, setVariants] = useState<VariantForm[]>([{
    sku: initialSku || '',
    ean: initialEan || '',
    cod_fabricante: '',
    tamanho: '',
    cor: '',
    preco_custo: 0,
    margem_lucro: 0,
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
      // Create or update product with variants
      const productData = {
        ...formData,
        variants: variants.map(variant => ({
          id: variant.id,
          sku: variant.sku,
          ean: variant.ean,
          cod_fabricante: variant.cod_fabricante,
          tamanho: variant.tamanho,
          cor: variant.cor,
          preco_base: variant.preco_base,
          estoque_atual: variant.estoque_atual,
          estoque_minimo: variant.estoque_minimo,
        }))
      };

      let product;
      if (mode === 'create') {
        product = await createProduct(productData);
      } else {
        product = await updateProduct(productId!, productData);
      }

      // Upload file images for new products
      if (mode === 'create' && product) {
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
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      descricao: '',
      codigo_interno: '',
      grupo_id: ''
    });
    setVariants([{
      sku: initialSku || '',
      ean: initialEan || '',
      cod_fabricante: '',
      tamanho: '',
      cor: '',
      preco_custo: 0,
      margem_lucro: 0,
      preco_base: 0,
      estoque_atual: 0,
      estoque_minimo: 0
    }]);
    setImages([]);
    setImageUrls([]);
    setCurrentImageUrl('');
  }, [initialSku, initialEan]);

  const addVariant = () => {
    setVariants([...variants, {
      sku: '',
      ean: '',
      cod_fabricante: '',
      tamanho: '',
      cor: '',
      preco_custo: 0,
      margem_lucro: 0,
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

  const updateVariantForm = (index: number, field: keyof VariantForm, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    
    // Calcular preço automaticamente quando custo ou margem mudarem
    if (field === 'preco_custo' || field === 'margem_lucro') {
      const custo = field === 'preco_custo' ? Number(value) : newVariants[index].preco_custo;
      const margem = field === 'margem_lucro' ? Number(value) : newVariants[index].margem_lucro;
      
      if (custo > 0 && margem >= 0 && margem < 100) {
        // Fórmula: Preço de Venda = Preço de Custo ÷ (1 – Margem de Lucro)
        const margemDecimal = margem / 100;
        const precoVenda = custo / (1 - margemDecimal);
        newVariants[index].preco_base = Math.round(precoVenda * 100) / 100; // Arredondar para 2 casas decimais
      }
    }
    
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

  const loadProductData = useCallback(async () => {
    if (!productId || mode === 'create') {
      console.log('🚫 Não carregando produto:', { productId, mode });
      return;
    }
    
    console.log('🔍 Iniciando carregamento do produto:', { productId, mode });
    console.log('🔍 Tipo do productId:', typeof productId);
    console.log('🔍 Valor do productId:', productId);
    
    setLoadingProduct(true);
    try {
      console.log('📞 Chamando getProduct com ID:', productId);
      const result = await getProduct(productId);
      console.log('📦 Resultado completo do getProduct:', result);
      console.log('📦 Tipo do resultado:', typeof result);
      
      if (result) {
        console.log('📋 Dados do produto extraídos:', result);
        console.log('📋 Tipo dos dados do produto:', typeof result);
        
        // Carregar dados do produto
        const newFormData = {
          nome: result.nome || '',
          descricao: result.descricao || '',
          codigo_interno: result.codigo_interno || '',
          grupo_id: result.grupo_id || ''
        };
        console.log('📝 Novos dados do formulário:', newFormData);
        setFormData(newFormData);

        // Carregar variantes
        if (result.variants && result.variants.length > 0) {
          const formattedVariants = result.variants.map((variant: any) => ({
            id: variant.id,
            sku: variant.sku || '',
            ean: variant.ean || '',
            cod_fabricante: variant.cod_fabricante || '',
            tamanho: variant.tamanho || '',
            cor: variant.cor || '',
            preco_custo: 0, // Campo não existe na tabela, calcular ou manter 0
            margem_lucro: 0, // Campo não existe na tabela, calcular ou manter 0
            preco_base: Number(variant.preco_base) || 0,
            estoque_atual: variant.estoque_atual || 0,
            estoque_minimo: variant.estoque_minimo || 0
          }));
          console.log('📦 Variantes formatadas:', formattedVariants);
          setVariants(formattedVariants);
        }
        
        console.log('✅ Dados carregados com sucesso');
      } else {
        console.log('❌ Nenhum resultado retornado do getProduct');
        console.log('❌ Valor exato do resultado:', result);
      }
    } catch (error) {
      console.error('❌ Error loading product data:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      toast({
        title: "Erro",
        description: `Não foi possível carregar os dados do produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setLoadingProduct(false);
    }
  }, [productId, mode]); // Removido getProduct e toast das dependências

  useEffect(() => {
    if (open && mode === 'create') {
      resetForm();
    } else if (open && (mode === 'edit' || mode === 'view') && productId) {
      loadProductData();
    }
  }, [open, mode, productId]); // Removido resetForm e loadProductData das dependências

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Novo Produto'}
            {mode === 'edit' && 'Editar Produto'}
            {mode === 'view' && 'Visualizar Produto'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && 'Preencha as informações para criar um novo produto'}
            {mode === 'edit' && 'Edite as informações do produto selecionado'}
            {mode === 'view' && 'Visualize as informações do produto'}
          </DialogDescription>
        </DialogHeader>

        {loadingProduct ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando dados do produto...</p>
            </div>
          </div>
        ) : (
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
                <Label htmlFor="codigo_interno">Código Interno</Label>
                <Input
                  id="codigo_interno"
                  value={formData.codigo_interno}
                  onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                  placeholder="COD001"
                  disabled={true}
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
          {(mode === 'create' || mode === 'edit') && (
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

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>SKU *</Label>
                        <Input
                          value={variant.sku}
                          onChange={(e) => updateVariantForm(index, 'sku', e.target.value)}
                          placeholder="SKU001"
                          required
                          disabled={isReadonly}
                        />
                      </div>
                      <div>
                        <Label>EAN</Label>
                        <Input
                          value={variant.ean}
                          onChange={(e) => updateVariantForm(index, 'ean', e.target.value)}
                          placeholder="7894900011517"
                          disabled={isReadonly}
                        />
                      </div>
                      <div>
                        <Label>Código de Fabricante</Label>
                        <Input
                          value={variant.cod_fabricante}
                          onChange={(e) => updateVariantForm(index, 'cod_fabricante', e.target.value)}
                          placeholder="FAB123"
                          disabled={isReadonly}
                        />
                      </div>
                      <div>
                        <Label>Tamanho</Label>
                        <Input
                          value={variant.tamanho}
                          onChange={(e) => updateVariantForm(index, 'tamanho', e.target.value)}
                          placeholder="M"
                          disabled={isReadonly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Cor</Label>
                        <Input
                          value={variant.cor}
                          onChange={(e) => updateVariantForm(index, 'cor', e.target.value)}
                          placeholder="Azul"
                          disabled={isReadonly}
                        />
                      </div>
                      <div>
                        <Label>Preço de Custo *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.preco_custo}
                          onChange={(e) => updateVariantForm(index, 'preco_custo', parseFloat(e.target.value) || 0)}
                          placeholder="100,00"
                          required
                          disabled={isReadonly}
                        />
                      </div>
                      <div>
                        <Label>Margem de Lucro (%) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="99.99"
                          value={variant.margem_lucro}
                          onChange={(e) => updateVariantForm(index, 'margem_lucro', parseFloat(e.target.value) || 0)}
                          placeholder="14"
                          required
                          disabled={isReadonly}
                        />
                      </div>
                      <div>
                        <Label>Preço de Venda</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.preco_base}
                          onChange={(e) => updateVariantForm(index, 'preco_base', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="bg-muted"
                          disabled={true}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Calculado automaticamente: Custo ÷ (1 - Margem%)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Estoque Atual</Label>
                        <Input
                          type="number"
                          value={variant.estoque_atual}
                          onChange={(e) => updateVariantForm(index, 'estoque_atual', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="bg-muted"
                          disabled={true}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Somente para visualização
                        </p>
                      </div>
                      <div>
                        <Label>Estoque Mínimo</Label>
                        <Input
                          type="number"
                          value={variant.estoque_minimo}
                          onChange={(e) => updateVariantForm(index, 'estoque_minimo', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          disabled={isReadonly}
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
        )}
      </DialogContent>
    </Dialog>
  );
};