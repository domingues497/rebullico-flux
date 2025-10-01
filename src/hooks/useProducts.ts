import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  grupo_id?: string;
  grupo_nome?: string;
  cod_interno: string;
  brand_id?: string;
  brand_name?: string;
  supplier_id?: string;
  supplier_name?: string;
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
  cod_interno: string;
  created_at: string;
  variant_id: string;
  sku: string;
  ean?: string;
  cod_fabricante?: string;
  tamanho?: string;
  cor?: string;
  preco_base: number;
  estoque_atual: number;
  estoque_minimo: number;
  brand_id?: string;
  brand_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  // Propriedades para compatibilidade
  name?: string;
  price?: number;
  stock?: number;
  minStock?: number;
  size?: string;
  color?: string;
  isLowStock?: boolean;
  // Array de variantes
  variants?: Array<{
    id: string;
    sku: string;
    ean?: string;
    cod_fabricante?: string;
    tamanho?: string;
    cor?: string;
    preco_base: number;
    estoque_atual: number;
    estoque_minimo: number;
  }>;
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
            created_at,
            brand_id,
            supplier_id,
            brands (
              id,
              nome
            ),
            suppliers (
              id,
              nome
            )
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
        cod_interno: item.products.cod_interno,
        created_at: item.products.created_at,
        grupo_nome: item.products.product_groups?.nome,
        brand_id: item.products.brand_id,
        brand_name: item.products.brands?.nome,
        supplier_id: item.products.supplier_id,
        supplier_name: item.products.suppliers?.nome,
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

  const getProduct = async (variantId: string): Promise<ProductWithVariant | null> => {
    try {
      console.log('🔍 getProduct chamado com variant ID:', variantId);
      
      // Primeiro, buscar a variante específica para obter o product_id
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('id', variantId)
        .single();

      if (variantError) {
        console.error('❌ Erro ao buscar variante:', variantError);
        throw variantError;
      }

      if (!variantData) {
        console.log('❌ Variante não encontrada');
        return null;
      }

      const productId = variantData.product_id;
      console.log('🔍 Product ID encontrado:', productId);

      // Agora buscar todas as variantes do produto
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          ean,
          cod_fabricante,
          tamanho,
          cor,
          preco_custo,
          margem_lucro,
          preco_base,
          preco_manual,
          estoque_atual,
          estoque_minimo,
          product_id,
          products!inner (
            id,
            nome,
            descricao,
            grupo_id,
            cod_interno,
            brand_id,
            supplier_id,
            created_at,
            brands (
              id,
              nome
            ),
            suppliers (
              id,
              nome
            )
          )
        `)
        .eq('product_id', productId);

      if (error) {
        console.error('❌ Erro ao buscar produto:', error);
        throw error;
      }

      console.log('🔍 Produto encontrado:', data);

      if (!data || data.length === 0) return null;

      // Usar a primeira variante como base para os dados do produto
      const firstVariant = data[0];
      const productData = firstVariant.products;

      const product = {
        id: firstVariant.id, // Usar o ID da variante como ID principal
        product_id: firstVariant.product_id,
        nome: productData.nome,
        descricao: productData.descricao,
        grupo_id: productData.grupo_id,
        cod_interno: productData.cod_interno,
        brand_id: productData.brand_id,
        supplier_id: productData.supplier_id,
        brand_name: productData.brands?.nome,
        supplier_name: productData.suppliers?.nome,
        created_at: productData.created_at,
        variant_id: firstVariant.id,
        sku: firstVariant.sku,
        ean: firstVariant.ean,
        cod_fabricante: firstVariant.cod_fabricante,
        tamanho: firstVariant.tamanho,
        cor: firstVariant.cor,
        preco_base: Number(firstVariant.preco_base),
        estoque_atual: firstVariant.estoque_atual,
        estoque_minimo: firstVariant.estoque_minimo,
        // Propriedades para compatibilidade
        name: productData.nome,
        price: Number(firstVariant.preco_base),
        stock: firstVariant.estoque_atual,
        minStock: firstVariant.estoque_minimo,
        size: firstVariant.tamanho,
        color: firstVariant.cor,
        isLowStock: firstVariant.estoque_atual <= firstVariant.estoque_minimo,
        // Adicionar todas as variantes do produto
        variants: data.map(variant => ({
          id: variant.id,
          sku: variant.sku || '',
          ean: variant.ean || '',
          cod_fabricante: variant.cod_fabricante || '',
          tamanho: variant.tamanho || '',
          cor: variant.cor || '',
          preco_custo: Number(variant.preco_custo) || 0,
          margem_lucro: Number(variant.margem_lucro) || 0,
          preco_base: Number(variant.preco_base) || 0,
          preco_manual: variant.preco_manual !== undefined ? variant.preco_manual : false,
          estoque_atual: variant.estoque_atual || 0,
          estoque_minimo: variant.estoque_minimo || 0
        }))
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
    brand_id?: string;
    supplier_id?: string;
    variants: Array<{
      sku: string;
      ean?: string;
      cod_fabricante?: string;
      tamanho?: string;
      cor?: string;
      preco_custo?: number;
      margem_lucro?: number;
      preco_base: number;
      preco_manual?: boolean;
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
          grupo_id: productData.grupo_id,
          brand_id: productData.brand_id,
          supplier_id: productData.supplier_id,
          cod_interno: '' // Will be auto-generated by trigger
        }] as any)
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
        preco_custo: variant.preco_custo || 0,
        margem_lucro: variant.margem_lucro || 0,
        preco_base: variant.preco_base,
        preco_manual: variant.preco_manual || false,
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

  const updateProduct = async (variantId: string, productData: {
    nome: string;
    descricao?: string;
    grupo_id?: string;
    cod_interno: string;
    brand_id?: string;
    supplier_id?: string;
    variants: Array<{
      id?: string;
      sku: string;
      ean?: string;
      cod_fabricante?: string;
      tamanho?: string;
      cor?: string;
      preco_custo?: number;
      margem_lucro?: number;
      preco_base: number;
      preco_manual?: boolean;
      estoque_atual: number;
      estoque_minimo: number;
    }>;
  }) => {
    try {
      console.log('🔄 updateProduct chamado com variant ID:', variantId);
      
      // Primeiro, buscar o product_id da variante
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('id', variantId)
        .single();

      if (variantError) {
        console.error('❌ Erro ao buscar variante:', variantError);
        throw variantError;
      }

      if (!variantData) {
        throw new Error('Variante não encontrada');
      }

      const productId = variantData.product_id;
      console.log('🔍 Product ID encontrado:', productId);

      // Atualizar o produto usando o product_id correto
      const { data, error } = await supabase
        .from('products')
        .update({
          nome: productData.nome,
          descricao: productData.descricao,
          grupo_id: productData.grupo_id,
          cod_interno: productData.cod_interno,
          brand_id: productData.brand_id,
          supplier_id: productData.supplier_id,
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar produto:', error);
        throw error;
      }

      console.log('✅ Produto atualizado:', data);

      // Atualizar as variantes
      for (const variant of productData.variants) {
        if (variant.id) {
          // Atualizar variante existente
          const { error: variantUpdateError } = await supabase
            .from('product_variants')
            .update({
              sku: variant.sku,
              ean: variant.ean,
              cod_fabricante: variant.cod_fabricante,
              tamanho: variant.tamanho,
              cor: variant.cor,
              preco_custo: variant.preco_custo || 0,
              margem_lucro: variant.margem_lucro || 0,
              preco_base: variant.preco_base,
              preco_manual: variant.preco_manual || false,
              estoque_atual: variant.estoque_atual,
              estoque_minimo: variant.estoque_minimo,
            })
            .eq('id', variant.id);

          if (variantUpdateError) {
            console.error('❌ Erro ao atualizar variante:', variantUpdateError);
            throw variantUpdateError;
          }
        } else {
          // Criar nova variante
          const { error: variantCreateError } = await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              sku: variant.sku,
              ean: variant.ean,
              cod_fabricante: variant.cod_fabricante,
              tamanho: variant.tamanho,
              cor: variant.cor,
              preco_custo: variant.preco_custo || 0,
              margem_lucro: variant.margem_lucro || 0,
              preco_base: variant.preco_base,
              preco_manual: variant.preco_manual || false,
              estoque_atual: variant.estoque_atual,
              estoque_minimo: variant.estoque_minimo,
            });

          if (variantCreateError) {
            console.error('❌ Erro ao criar variante:', variantCreateError);
            throw variantCreateError;
          }
        }
      }

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