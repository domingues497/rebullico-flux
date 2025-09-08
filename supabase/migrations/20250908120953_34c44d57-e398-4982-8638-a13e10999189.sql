-- Fix security definer functions that could bypass RLS
-- Keep get_user_role and handle_new_user as SECURITY DEFINER (they need elevated privileges)
-- Change stock functions to SECURITY INVOKER to respect RLS policies

-- Update stock entry function to use SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.update_stock_on_entry(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update stock by adding the quantity
  -- This will now respect RLS policies on product_variants table
  UPDATE product_variants 
  SET estoque_atual = estoque_atual + p_quantity,
      updated_at = now()
  WHERE id = p_variant_id;
  
  -- Verify the update was successful (will fail if user lacks permission)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permissão negada ou produto não encontrado';
  END IF;
  
  -- Create stock movement record
  INSERT INTO stock_movements (
    product_variant_id,
    tipo_movimento,
    quantidade,
    observacoes
  ) VALUES (
    p_variant_id,
    'entrada'::movement_type,
    p_quantity,
    'Entrada de estoque'
  );
END;
$$;

-- Update stock sale function to use SECURITY INVOKER  
CREATE OR REPLACE FUNCTION public.update_stock_on_sale(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update stock by reducing the quantity
  -- This will now respect RLS policies on product_variants table
  UPDATE product_variants 
  SET estoque_atual = estoque_atual - p_quantity,
      updated_at = now()
  WHERE id = p_variant_id;
  
  -- Verify the update was successful (will fail if user lacks permission)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permissão negada ou produto não encontrado';
  END IF;
  
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