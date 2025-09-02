-- Drop and recreate the update_stock_on_sale function with proper signature
DROP FUNCTION IF EXISTS public.update_stock_on_sale(uuid, integer);

-- Create the stock update function
CREATE OR REPLACE FUNCTION public.update_stock_on_sale(
  p_variant_id UUID,
  p_quantity INTEGER
) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update stock by reducing the quantity
  UPDATE product_variants 
  SET estoque_atual = estoque_atual - p_quantity,
      updated_at = now()
  WHERE id = p_variant_id;
  
  -- Validate stock doesn't go negative
  IF (SELECT estoque_atual FROM product_variants WHERE id = p_variant_id) < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente para o produto';
  END IF;
  
  -- Create stock movement record
  INSERT INTO stock_movements (
    product_variant_id,
    tipo_movimento,
    quantidade,
    observacoes
  ) VALUES (
    p_variant_id,
    'saida'::movement_type,
    p_quantity,
    'Venda realizada'
  );
END;
$$;