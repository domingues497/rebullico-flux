-- Migração para mover cod_fabricante da tabela products para product_variants
-- Data: 2025-01-23

-- 1. Adicionar coluna cod_fabricante na tabela product_variants
ALTER TABLE public.product_variants 
ADD COLUMN cod_fabricante VARCHAR(100);

-- 2. Migrar dados existentes de products para product_variants
-- Para cada produto que tem cod_fabricante, aplicar a todas suas variantes
UPDATE public.product_variants 
SET cod_fabricante = p.cod_fabricante
FROM public.products p
WHERE product_variants.product_id = p.id 
AND p.cod_fabricante IS NOT NULL;

-- 3. Remover coluna cod_fabricante da tabela products
ALTER TABLE public.products 
DROP COLUMN cod_fabricante;

-- 4. Comentário para documentar a mudança
COMMENT ON COLUMN public.product_variants.cod_fabricante IS 'Código do fabricante específico para cada variante do produto';