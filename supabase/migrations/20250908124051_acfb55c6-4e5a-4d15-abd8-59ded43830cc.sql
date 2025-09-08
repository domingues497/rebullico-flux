-- Fix security definer view issue by recreating v_stock_balance view
-- The view should respect RLS policies of underlying tables

-- Drop and recreate the view to ensure proper security context
DROP VIEW IF EXISTS public.v_stock_balance;

-- Recreate the view with explicit security invoker behavior
CREATE VIEW public.v_stock_balance 
WITH (security_invoker = true) AS 
SELECT 
    pv.id AS variant_id,
    pv.sku,
    pv.ean,
    p.nome AS product_name,
    pv.tamanho,
    pv.cor,
    pv.preco_base,
    pv.estoque_atual,
    pv.estoque_minimo,
    CASE
        WHEN (pv.estoque_atual <= pv.estoque_minimo) THEN true
        ELSE false
    END AS is_low_stock
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
ORDER BY p.nome, pv.tamanho, pv.cor;

-- Enable RLS on the view to ensure it respects user permissions
ALTER VIEW public.v_stock_balance SET (security_invoker = true);

-- Grant appropriate permissions
GRANT SELECT ON public.v_stock_balance TO authenticated;
GRANT SELECT ON public.v_stock_balance TO anon;