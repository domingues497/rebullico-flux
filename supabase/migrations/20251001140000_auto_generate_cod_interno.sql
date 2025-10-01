-- Criar função para gerar código interno automático
CREATE OR REPLACE FUNCTION generate_cod_interno()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER;
BEGIN
    -- Buscar o próximo número sequencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(cod_interno FROM 'PROD-(\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM products
    WHERE cod_interno ~ '^PROD-\d+$';
    
    -- Gerar o código no formato PROD-XXXX (com padding de zeros)
    new_code := 'PROD-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar cod_interno automaticamente
CREATE OR REPLACE FUNCTION set_cod_interno()
RETURNS TRIGGER AS $$
BEGIN
    -- Se cod_interno não foi fornecido ou está vazio, gerar automaticamente
    IF NEW.cod_interno IS NULL OR NEW.cod_interno = '' THEN
        NEW.cod_interno := generate_cod_interno();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela products
DROP TRIGGER IF EXISTS trigger_set_cod_interno ON products;
CREATE TRIGGER trigger_set_cod_interno
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_cod_interno();

-- Atualizar produtos existentes que não têm cod_interno
UPDATE products 
SET cod_interno = generate_cod_interno()
WHERE cod_interno IS NULL OR cod_interno = '';