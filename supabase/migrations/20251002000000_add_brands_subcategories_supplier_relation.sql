-- Migration: Add brands, subcategories hierarchy, and product-supplier relationship
-- Date: 2025-10-02
-- Purpose: Complete RF4.1 implementation

-- 1. Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update product_groups to support hierarchy (subcategories)
ALTER TABLE public.product_groups 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.product_groups(id),
ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Add brand_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id),
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_groups_parent_id ON public.product_groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_brands_nome ON public.brands(nome);
CREATE INDEX IF NOT EXISTS idx_brands_ativo ON public.brands(ativo);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers for updated_at
CREATE TRIGGER update_brands_updated_at 
    BEFORE UPDATE ON public.brands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_groups_updated_at 
    BEFORE UPDATE ON public.product_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert some default brands
INSERT INTO public.brands (nome, descricao) VALUES
('Sem Marca', 'Produtos sem marca definida'),
('Nike', 'Marca esportiva internacional'),
('Adidas', 'Marca esportiva internacional'),
('Puma', 'Marca esportiva internacional'),
('Lacoste', 'Marca de moda francesa'),
('Tommy Hilfiger', 'Marca de moda americana'),
('Calvin Klein', 'Marca de moda americana'),
('Levi''s', 'Marca de jeans americana'),
('Zara', 'Marca de moda espanhola'),
('H&M', 'Marca de moda sueca')
ON CONFLICT (nome) DO NOTHING;

-- 8. Update existing product_groups to set default values
UPDATE public.product_groups 
SET 
    nivel = 1,
    ativo = true,
    updated_at = timezone('utc'::text, now())
WHERE nivel IS NULL;

-- 9. Insert some example subcategories
INSERT INTO public.product_groups (nome, parent_id, nivel, estoque_minimo_default) 
SELECT 
    'Manga Longa',
    pg.id,
    2,
    5
FROM public.product_groups pg 
WHERE pg.nome = 'Camisetas' AND pg.nivel = 1
ON CONFLICT DO NOTHING;

INSERT INTO public.product_groups (nome, parent_id, nivel, estoque_minimo_default) 
SELECT 
    'Manga Curta',
    pg.id,
    2,
    5
FROM public.product_groups pg 
WHERE pg.nome = 'Camisetas' AND pg.nivel = 1
ON CONFLICT DO NOTHING;

INSERT INTO public.product_groups (nome, parent_id, nivel, estoque_minimo_default) 
SELECT 
    'Skinny',
    pg.id,
    2,
    3
FROM public.product_groups pg 
WHERE pg.nome = 'Calças' AND pg.nivel = 1
ON CONFLICT DO NOTHING;

INSERT INTO public.product_groups (nome, parent_id, nivel, estoque_minimo_default) 
SELECT 
    'Straight',
    pg.id,
    2,
    3
FROM public.product_groups pg 
WHERE pg.nome = 'Calças' AND pg.nivel = 1
ON CONFLICT DO NOTHING;

-- 10. Create view for hierarchical categories
CREATE OR REPLACE VIEW public.v_product_categories AS
WITH RECURSIVE category_hierarchy AS (
    -- Base case: root categories (nivel 1)
    SELECT 
        id,
        nome,
        parent_id,
        nivel,
        ativo,
        nome as full_path,
        ARRAY[nome] as path_array
    FROM public.product_groups 
    WHERE parent_id IS NULL AND ativo = true
    
    UNION ALL
    
    -- Recursive case: subcategories
    SELECT 
        pg.id,
        pg.nome,
        pg.parent_id,
        pg.nivel,
        pg.ativo,
        ch.full_path || ' > ' || pg.nome as full_path,
        ch.path_array || pg.nome as path_array
    FROM public.product_groups pg
    INNER JOIN category_hierarchy ch ON pg.parent_id = ch.id
    WHERE pg.ativo = true
)
SELECT 
    id,
    nome,
    parent_id,
    nivel,
    ativo,
    full_path,
    path_array
FROM category_hierarchy
ORDER BY full_path;

-- 11. Create view for products with all related data
CREATE OR REPLACE VIEW public.v_products_complete AS
SELECT 
    p.id,
    p.nome,
    p.descricao,
    p.cod_interno,
    p.ean_default,
    p.created_at,
    p.updated_at,
    -- Brand information
    b.id as brand_id,
    b.nome as brand_name,
    -- Supplier information
    s.id as supplier_id,
    s.nome as supplier_name,
    s.cnpj_cpf as supplier_document,
    -- Category information
    pg.id as category_id,
    pg.nome as category_name,
    pg.parent_id as category_parent_id,
    pg.nivel as category_level,
    -- Parent category (for subcategories)
    parent_pg.nome as parent_category_name,
    -- Full category path
    CASE 
        WHEN pg.parent_id IS NOT NULL THEN parent_pg.nome || ' > ' || pg.nome
        ELSE pg.nome
    END as category_full_path
FROM public.products p
LEFT JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.suppliers s ON p.supplier_id = s.id
LEFT JOIN public.product_groups pg ON p.grupo_id = pg.id
LEFT JOIN public.product_groups parent_pg ON pg.parent_id = parent_pg.id;

-- 12. Enable RLS (Row Level Security) for new tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies for brands
CREATE POLICY "Enable read access for all users" ON public.brands
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.brands
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.brands
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.brands
    FOR DELETE USING (auth.role() = 'authenticated');

-- 14. Grant permissions
GRANT ALL ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
GRANT SELECT ON public.v_product_categories TO authenticated;
GRANT SELECT ON public.v_product_categories TO service_role;
GRANT SELECT ON public.v_products_complete TO authenticated;
GRANT SELECT ON public.v_products_complete TO service_role;

-- 15. Comment tables and columns for documentation
COMMENT ON TABLE public.brands IS 'Tabela de marcas dos produtos';
COMMENT ON COLUMN public.brands.nome IS 'Nome da marca';
COMMENT ON COLUMN public.brands.descricao IS 'Descrição da marca';
COMMENT ON COLUMN public.brands.ativo IS 'Indica se a marca está ativa';

COMMENT ON COLUMN public.product_groups.parent_id IS 'ID da categoria pai (para subcategorias)';
COMMENT ON COLUMN public.product_groups.nivel IS 'Nível hierárquico da categoria (1=categoria, 2=subcategoria)';
COMMENT ON COLUMN public.product_groups.ativo IS 'Indica se a categoria está ativa';

COMMENT ON COLUMN public.products.brand_id IS 'ID da marca do produto';
COMMENT ON COLUMN public.products.supplier_id IS 'ID do fornecedor do produto';

COMMENT ON VIEW public.v_product_categories IS 'View hierárquica das categorias e subcategorias';
COMMENT ON VIEW public.v_products_complete IS 'View completa dos produtos com marca, fornecedor e categoria';