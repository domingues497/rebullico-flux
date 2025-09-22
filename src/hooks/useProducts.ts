import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  cod_interno: string;
  cod_fabricante?: string;
  ean_default?: string;
  grupo_id?: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  ean?: string;
  tamanho?: string;
  cor?: string;
  preco_base: number;
  estoque_atual: number;
  estoque_minimo: number;
  created_at: string;
}

export interface ProductGroup {
  id: string;
  nome: string;
  estoque_minimo_default: number;
  created_at: string;
}

export interface StockBalanceView {
  product_id: string;
  product_name: string;
  descricao?: string;
  cod_interno: string;
  cod_fabricante?: string;
  ean_default?: string;
  grupo_id?: string;
  variant_id: string;
  sku: string;
  ean?: string;
  tamanho?: string;
  cor?: string;
  preco_base: number;
  estoque_atual: number;
  estoque_minimo: number;
  created_at: string;
}

export interface ProductWithVariant {
  id: string;
  nome: string;
  descricao?: string;
  cod_interno: string;
  cod_fabricante?: string;
  ean_default?: string;
  grupo_id?: string;
  created_at: string;
  variant_id: string;
  sku: string;
  ean?: string;
  tamanho?: string;
  cor?: string;
  preco_base: number;
  estoque_atual: number;
  estoque_minimo: number;
  // Propriedades para compatibilidade com a página Products
  name?: string;
  price?: number;
  stock?: number;
  minStock?: number;
  size?: string;
  color?: string;
  isLowStock?: boolean;
}

export const useProducts = () => {
  const [products, setProducts] = useState<ProductWithVariant[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('v_stock_balance')
        .select('*')
        .order('product_name');
      
      if (error) throw error;

      const groupedProducts = data?.reduce((acc: ProductWithVariant[], item: StockBalanceView) => {
        const existingProduct = acc.find(p => p.variant_id === item.variant_id);
        if (!existingProduct) {
          const isLowStock = item.estoque_atual <= item.estoque_minimo;
          acc.push({
            id: item.product_id,
            nome: item.product_name,
            descricao: item.descricao,
            cod_interno: item.cod_interno,
            cod_fabricante: item.cod_fabricante,
            ean_default: item.ean_default,
            grupo_id: item.grupo_id,
            created_at: item.created_at,
            variant_id: item.variant_id,
            sku: item.sku,
            ean: item.ean,
            tamanho: item.tamanho,
            cor: item.cor,
            preco_base: Number(item.preco_base),
            estoque_atual: item.estoque_atual,
            estoque_minimo: item.estoque_minimo,
            // Propriedades para compatibilidade
            name: item.product_name,
            price: Number(item.preco_base),
            stock: item.estoque_atual,
            minStock: item.estoque_minimo,
            size: item.tamanho,
            color: item.cor,
            isLowStock: isLowStock
          });
        }
        return acc;
      }, []) || [];

      setProducts(groupedProducts);
    } catch (error: unknown) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .select('*')
        .order('nome');

      if (error) throw error;

      setGroups(data || []);
    } catch (error: unknown) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos",
        variant: "destructive"
      });
    }
  };

  const getProduct = async (id: string) => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;

      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      if (variantsError) throw variantsError;

      return {
        product: productData,
        variants: variantsData || []
      };
    } catch (error: unknown) {
      console.error('Error fetching product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o produto",
        variant: "destructive"
      });
      throw error;
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'cod_interno'>) => {
    try {
      // Generate auto internal code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_product_code');

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          cod_interno: codeData
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso"
      });

      await fetchProducts();
      return data;
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar produto';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso"
      });

      await fetchProducts();
      return data;
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar produto';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  };

  const createVariant = async (variantData: Omit<ProductVariant, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert([variantData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Variante criada com sucesso"
      });

      await fetchProducts();
      return data;
    } catch (error: unknown) {
      console.error('Error creating variant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar variante';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateVariant = async (id: string, variantData: Partial<ProductVariant>) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .update(variantData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Variante atualizada com sucesso"
      });

      await fetchProducts();
      return data;
    } catch (error: unknown) {
      console.error('Error updating variant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar variante';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const uploadProductImage = async (productId: string, file: File, isPrincipal = false) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('product_images')
        .insert([{
          product_id: productId,
          url: publicUrl,
          url_link: null,
          principal: isPrincipal
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso"
      });

      return publicUrl;
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar imagem';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const addProductImageUrl = async (productId: string, imageUrl: string, isPrincipal = false) => {
    try {
      const { error: dbError } = await supabase
        .from('product_images')
        .insert([{
          product_id: productId,
          url: null,
          url_link: imageUrl,
          principal: isPrincipal
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Imagem adicionada com sucesso"
      });

      return imageUrl;
    } catch (error: unknown) {
      console.error('Error adding image URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar imagem';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchGroups();
  }, []);

  return {
    products,
    groups,
    loading,
    fetchProducts,
    fetchGroups,
    getProduct,
    createProduct,
    updateProduct,
    createVariant,
    updateVariant,
    uploadProductImage,
    addProductImageUrl
  };
};