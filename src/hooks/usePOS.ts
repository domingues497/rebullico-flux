import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export interface CartItem {
  id: string;
  product_variant_id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount_percent?: number;
  discount_amount?: number;
  final_price: number;
}

export interface Customer {
  id: string;
  nome: string;
  grupo_pessoas_id?: string;
  customer_group?: {
    nome: string;
    desconto_percentual: number;
  };
}

export interface PaymentMethod {
  bandeira: string;
  taxa_percentual: number;
  parcelas: number;
  taxa_fixa: number;
}

export interface Payment {
  method: string;
  amount: number;
  installments: number;
  fee_percent: number;
  fee_amount: number;
  net_amount: number;
}

export function usePOS() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemDiscounts = cartItems.reduce((sum, item) => sum + ((item.discount_amount || 0) * item.quantity), 0);
  const totalDiscount = itemDiscounts + discount;
  const total = Math.max(0, subtotal - totalDiscount);

  // Round to nearest 0.05 if enabled
  const roundToNearestFiveCents = (amount: number): number => {
    return Math.round(amount * 20) / 20;
  };

  // Add item to cart
  const addToCart = useCallback(async (variantId: string) => {
    try {
      const { data: variant, error } = await supabase
        .from('product_variants')
        .select(`
          id, sku, preco_base, estoque_atual,
          product:products(nome)
        `)
        .eq('id', variantId)
        .single();

      if (error) throw error;
      if (!variant) throw new Error('Produto não encontrado');

      if (variant.estoque_atual <= 0) {
        toast({
          title: "Estoque insuficiente",
          description: "Este produto não possui estoque disponível",
          variant: "destructive"
        });
        return;
      }

      const existingItem = cartItems.find(item => item.product_variant_id === variantId);
      
      if (existingItem) {
        if (existingItem.quantity >= variant.estoque_atual) {
          toast({
            title: "Estoque insuficiente",
            description: `Estoque disponível: ${variant.estoque_atual}`,
            variant: "destructive"
          });
          return;
        }
        updateQuantity(variantId, existingItem.quantity + 1);
      } else {
        const newItem: CartItem = {
          id: `${variantId}-${Date.now()}`,
          product_variant_id: variantId,
          name: variant.product.nome,
          sku: variant.sku,
          price: Number(variant.preco_base),
          quantity: 1,
          final_price: Number(variant.preco_base),
        };

        // Apply customer group discount if applicable
        if (selectedCustomer?.customer_group?.desconto_percentual) {
          const discountPercent = selectedCustomer.customer_group.desconto_percentual;
          newItem.discount_percent = discountPercent;
          newItem.discount_amount = newItem.price * (discountPercent / 100);
          newItem.final_price = newItem.price - newItem.discount_amount;
        }

        setCartItems(prev => [...prev, newItem]);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [cartItems, selectedCustomer, toast]);

  // Update item quantity
  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }

    setCartItems(prev => prev.map(item => 
      item.product_variant_id === variantId 
        ? { ...item, quantity }
        : item
    ));
  }, []);

  // Update item price
  const updatePrice = useCallback((variantId: string, price: number) => {
    setCartItems(prev => prev.map(item => 
      item.product_variant_id === variantId 
        ? { 
            ...item, 
            price,
            final_price: price - (item.discount_amount || 0)
          }
        : item
    ));
  }, []);

  // Apply item discount
  const applyItemDiscount = useCallback((variantId: string, discountPercent: number) => {
    setCartItems(prev => prev.map(item => 
      item.product_variant_id === variantId 
        ? { 
            ...item, 
            discount_percent: discountPercent,
            discount_amount: item.price * (discountPercent / 100),
            final_price: item.price * (1 - discountPercent / 100)
          }
        : item
    ));
  }, []);

  // Remove item from cart
  const removeItem = useCallback((variantId: string) => {
    setCartItems(prev => prev.filter(item => item.product_variant_id !== variantId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscount(0);
  }, []);

  // Process sale
  const processSale = useCallback(async (payments: Payment[], observations?: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (cartItems.length === 0) throw new Error('Carrinho vazio');
    if (payments.length === 0) throw new Error('Nenhum pagamento informado');

    const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentsTotal - total) > 0.01) {
      throw new Error('Valor dos pagamentos não confere com o total');
    }

    setIsProcessing(true);

    try {
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          customer_id: selectedCustomer?.id,
          total_bruto: subtotal,
          desconto_total: totalDiscount,
          total_liquido: total,
          observacoes: observations,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
        product_variant_id: item.product_variant_id,
        quantidade: item.quantity,
        preco_unit: item.price,
        desconto_item: item.discount_amount || 0,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Create payments
      const salePayments = payments.map(payment => ({
        sale_id: sale.id,
        tipo: payment.method as any,
        valor: payment.amount,
        parcelas: payment.installments,
        bandeira: payment.method !== 'dinheiro' && payment.method !== 'pix' ? payment.method : null,
      }));

      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(salePayments);

      if (paymentsError) throw paymentsError;

      // Create sale costs (fees)
      if (payments.some(p => p.fee_amount > 0)) {
        const totalFees = payments.reduce((sum, p) => sum + p.fee_amount, 0);
        
        const { error: costsError } = await supabase
          .from('sale_costs')
          .insert({
            sale_id: sale.id,
            taxa_financeira: totalFees,
          });

        if (costsError) throw costsError;
      }

      // Update stock by reducing quantities sold
      for (const item of cartItems) {
        // Get current stock first
        const { data: currentVariant, error: getError } = await supabase
          .from('product_variants')
          .select('estoque_atual')
          .eq('id', item.product_variant_id)
          .single();

        if (getError) throw getError;

        const newStock = currentVariant.estoque_atual - item.quantity;
        if (newStock < 0) {
          throw new Error(`Estoque insuficiente para o produto ${item.name}`);
        }

        // Update stock
        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ estoque_atual: newStock })
          .eq('id', item.product_variant_id);

        if (stockError) throw stockError;
      }

      toast({
        title: "Venda realizada!",
        description: `Venda #${sale.id.split('-')[0]} processada com sucesso`,
      });

      clearCart();
      
      return sale;
    } catch (error: any) {
      toast({
        title: "Erro ao processar venda",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, cartItems, selectedCustomer, subtotal, totalDiscount, total, toast, clearCart]);

  return {
    cartItems,
    selectedCustomer,
    discount,
    subtotal,
    totalDiscount,
    total,
    isProcessing,
    setSelectedCustomer,
    setDiscount,
    addToCart,
    updateQuantity,
    updatePrice,
    applyItemDiscount,
    removeItem,
    clearCart,
    processSale,
    roundToNearestFiveCents,
  };
}