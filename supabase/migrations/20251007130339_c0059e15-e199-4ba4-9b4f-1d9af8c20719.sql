-- Atualizar função para calcular custo médio ponderado na entrada de estoque
CREATE OR REPLACE FUNCTION public.update_stock_on_entry(p_variant_id uuid, p_quantity integer, p_custo_unit numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_quantidade_antiga integer;
  v_custo_medio_antigo numeric;
  v_custo_total_antigo numeric;
  v_custo_total_entrada numeric;
  v_novo_custo_medio numeric;
BEGIN
  -- Buscar quantidade e custo médio atual
  SELECT estoque_atual, COALESCE(preco_custo, 0)
  INTO v_quantidade_antiga, v_custo_medio_antigo
  FROM product_variants
  WHERE id = p_variant_id;
  
  -- Verificar se o produto existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;
  
  -- Calcular custo total antigo
  v_custo_total_antigo := v_quantidade_antiga * v_custo_medio_antigo;
  
  -- Calcular custo total da entrada
  v_custo_total_entrada := p_quantity * p_custo_unit;
  
  -- Calcular novo custo médio ponderado
  IF (v_quantidade_antiga + p_quantity) > 0 THEN
    v_novo_custo_medio := (v_custo_total_antigo + v_custo_total_entrada) / (v_quantidade_antiga + p_quantity);
  ELSE
    v_novo_custo_medio := p_custo_unit;
  END IF;
  
  -- Atualizar estoque e custo médio
  UPDATE product_variants 
  SET estoque_atual = estoque_atual + p_quantity,
      preco_custo = v_novo_custo_medio,
      updated_at = now()
  WHERE id = p_variant_id;
  
  -- Criar registro de movimentação de estoque
  INSERT INTO stock_movements (
    product_variant_id,
    tipo_movimento,
    quantidade,
    observacoes
  ) VALUES (
    p_variant_id,
    'entrada'::movement_type,
    p_quantity,
    'Entrada de estoque - Custo unitário: ' || p_custo_unit::text || ' - Novo custo médio: ' || v_novo_custo_medio::text
  );
END;
$function$;