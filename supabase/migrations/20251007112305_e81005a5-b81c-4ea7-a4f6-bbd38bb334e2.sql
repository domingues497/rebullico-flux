-- 1) Add updated_at to product_variants (fix for function dependency)
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());

-- 2) Ensure updated_at auto-maintains on updates
DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Recreate update_stock_on_entry just to ensure proper SECURITY DEFINER and search_path
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
