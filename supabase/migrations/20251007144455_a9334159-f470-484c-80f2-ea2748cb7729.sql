-- Recalcular preço automaticamente quando custo/margem mudarem
CREATE OR REPLACE FUNCTION public.recalc_preco_base()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Só recalcula quando o preço não é manual
  IF COALESCE(NEW.preco_manual, false) = false THEN
    NEW.preco_base := COALESCE(NEW.preco_custo, 0) * (1 + COALESCE(NEW.margem_lucro, 0)/100.0);
  END IF;
  RETURN NEW;
END;
$$;

-- Evitar duplicidade de trigger
DROP TRIGGER IF EXISTS trg_recalc_preco_base ON public.product_variants;

-- Dispara em INSERT e quando custo, margem ou flag manual mudarem
CREATE TRIGGER trg_recalc_preco_base
BEFORE INSERT OR UPDATE OF preco_custo, margem_lucro, preco_manual
ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.recalc_preco_base();