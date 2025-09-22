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
    setLoading(true);
    try {
      console.log('🔍 Buscando produtos...');
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          ean,
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
            cod_interno,
            cod_fabricante,
            ean_default,
            grupo_id,
            created_at
          )
        `);

      if (error) throw error;

      console.log('🔍 Dados recebidos do Supabase:', data);

      const groupedProducts = data?.reduce((acc: any[], item: any) => {
        const existingProduct = acc.find(p => p.id === item.product_id);
        if (!existingProduct) {
          console.log('🔍 Processando produto:', item.products.nome, 'ID:', item.product_id);
          const isLowStock = item.estoque_atual <= item.estoque_minimo;
          acc.push({
            id: item.product_id,
            nome: item.products.nome,
            descricao: item.products.descricao,
            cod_interno: item.products.cod_interno,
            cod_fabricante: item.products.cod_fabricante,
            ean_default: item.products.ean_default,
            grupo_id: item.products.grupo_id,
            created_at: item.products.created_at,
            variant_id: item.id,
            sku: item.sku,
            ean: item.ean,
            tamanho: item.tamanho,
            cor: item.cor,
            preco_base: Number(item.preco_base),
            estoque_atual: item.estoque_atual,
            estoque_minimo: item.estoque_minimo,
            // Propriedades para compatibilidade
            name: item.products.nome,
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
            cod_interno,
            cod_fabricante,
            ean_default,
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
        cod_interno: data.products.cod_interno,
        cod_fabricante: data.products.cod_fabricante,
        ean_default: data.products.ean_default,
        grupo_id: data.products.grupo_id,
        created_at: data.products.created_at,
        variant_id: data.id,
        sku: data.sku,
        ean: data.ean,
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