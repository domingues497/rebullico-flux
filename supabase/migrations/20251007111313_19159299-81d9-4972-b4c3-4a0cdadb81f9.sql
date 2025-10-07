-- Fix update_stock_on_entry function to bypass RLS
CREATE OR REPLACE FUNCTION public.update_stock_on_entry(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update stock by adding the quantity
  UPDATE product_variants 
  SET estoque_atual = estoque_atual + p_quantity,
      updated_at = now()
  WHERE id = p_variant_id;
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado';
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
$function$;