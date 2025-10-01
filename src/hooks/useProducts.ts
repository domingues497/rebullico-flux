import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  grupo_id?: string;
  grupo_nome?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  ean?: string;
  cod_fabricante?: string;
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
  id: string;
  product_id: string;
  variant_id: string;
  nome: string;
  descricao?: string;
  grupo_id?: string;
  grupo_nome?: string;
  sku: string;
  ean?: string;
  cod_fabricante?: string;
  tamanho?: string;
  cor?: string;
  preco_base: number;
  estoque_atual: number;
  estoque_minimo: number;
}

export interface ProductWithVariant {
  id: string;
  nome: string;
  descricao?: string;
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
  // Propriedades para compatibilidade
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
    setLoading(true);
    try {
      console.log('🔍 Buscando produtos...');
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          ean,
          cod_fabricante,
          tamanho,
          cor,
          preco_base,
          estoque_atual,
          estoque_minimo,
          product_id,
          products!inner (
            id,
            nome,
            descricao,
            grupo_id,
            cod_interno,
            created_at
          )
        `);

      if (error) throw error;

      console.log('🔍 Dados recebidos do Supabase:', data);

      const groupedProducts = data?.map((item: any) => ({
        id: item.id,
        product_id: item.products.id,
        variant_id: item.id,
        nome: item.products.nome,
        descricao: item.products.descricao,
        grupo_id: item.products.grupo_id,
        grupo_nome: item.products.product_groups?.nome,
        sku: item.sku,
        ean: item.ean,
        cod_fabricante: item.cod_fabricante,
        tamanho: item.tamanho,
        cor: item.cor,
        preco_base: item.preco_base,
        estoque_atual: item.estoque_atual,
        estoque_minimo: item.estoque_minimo,
        // Propriedades para compatibilidade
        name: item.products.nome,
        price: Number(item.preco_base),
        stock: item.estoque_atual,
        minStock: item.estoque_minimo,
        size: item.tamanho,
        color: item.cor,
        isLowStock: item.estoque_atual <= item.estoque_minimo
      })) || []

      console.log('🔍 Produtos processados:', groupedProducts);
      
      // Ordenar os produtos por nome após o processamento
      const sortedProducts = groupedProducts.sort((a, b) => 
        a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
      );
      
      setProducts(sortedProducts);
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

  const getProduct = async (productId: string): Promise<ProductWithVariant | null> => {
    try {
      console.log('🔍 getProduct chamado com ID:', productId);
      
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          ean,
          cod_fabricante,
          tamanho,
          cor,
          preco_base,
          estoque_atual,
          estoque_minimo,
          product_id,
          products!inner (
            id,
            nome,
            descricao,
            grupo_id,
            created_at
          )
        `)
        .eq('product_id', productId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar produto:', error);
        throw error;
      }

      console.log('🔍 Produto encontrado:', data);

      if (!data) return null;

      const product = {
        id: data.product_id,
        nome: data.products.nome,
        descricao: data.products.descricao,
        grupo_id: data.products.grupo_id,
        cod_interno: data.products.cod_interno,
        created_at: data.products.created_at,
        variant_id: data.id,
        sku: data.sku,
        ean: data.ean,
        cod_fabricante: data.cod_fabricante,
        tamanho: data.tamanho,
        cor: data.cor,
        preco_base: Number(data.preco_base),
        estoque_atual: data.estoque_atual,
        estoque_minimo: data.estoque_minimo,
        // Propriedades para compatibilidade
        name: data.products.nome,
        price: Number(data.preco_base),
        stock: data.estoque_atual,
        minStock: data.estoque_minimo,
        size: data.tamanho,
        color: data.cor,
        isLowStock: data.estoque_atual <= data.estoque_minimo
      };

      console.log('🔍 Produto processado:', product);
      return product;
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

  const createProduct = async (productData: {
    nome: string;
    descricao?: string;
    grupo_id?: string;
    variants: Array<{
      sku: string;
      ean?: string;
      cod_fabricante?: string;
      tamanho?: string;
      cor?: string;
      preco_base: number;
      estoque_atual: number;
      estoque_minimo: number;
    }>;
  }) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert([{
          nome: productData.nome,
          descricao: productData.descricao,
          grupo_id: productData.grupo_id
        }])
        .select()
        .single();

      if (error) throw error;

      // Create variants for the product
      const variantsToInsert = productData.variants.map(variant => ({
        product_id: product.id,
        sku: variant.sku,
        ean: variant.ean,
        cod_fabricante: variant.cod_fabricante,
        tamanho: variant.tamanho,
        cor: variant.cor,
        preco_base: variant.preco_base,
        estoque_atual: variant.estoque_atual,
        estoque_minimo: variant.estoque_minimo,
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (variantsError) throw variantsError;

      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso"
      });

      await fetchProducts();
      return product;
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

  const updateProduct = async (id: string, productData: {
    nome: string;
    descricao?: string;
    grupo_id?: string;
    cod_interno: string;
    variants: Array<{
      id?: string;
      sku: string;
      ean?: string;
      cod_fabricante?: string;
      tamanho?: string;
      cor?: string;
      preco_base: number;
      estoque_atual: number;
      estoque_minimo: number;
    }>;
  }) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          nome: productData.nome,
          descricao: productData.descricao,
          grupo_id: productData.grupo_id,
          cod_interno: productData.cod_interno,
        })
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