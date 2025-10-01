-- Adicionar campos de preço à tabela product_variants
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS preco_custo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margem_lucro DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS preco_manual BOOLEAN DEFAULT false;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.product_variants.preco_custo IS 'Preço de custo da variante do produto';
COMMENT ON COLUMN public.product_variants.margem_lucro IS 'Margem de lucro em percentual para cálculo automático do preço';
COMMENT ON COLUMN public.product_variants.preco_manual IS 'Indica se o preço de venda foi definido manualmente ou calculado automaticamente';

-- Para produtos existentes, definir preco_manual como true (assumindo que já têm preços definidos)
UPDATE public.product_variants 
SET preco_manual = true 
WHERE preco_base > 0;