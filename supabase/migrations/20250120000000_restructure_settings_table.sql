-- Reestruturação da tabela settings seguindo melhores práticas
-- Removendo a estrutura JSON e criando colunas específicas

-- Primeiro, vamos salvar os dados existentes
CREATE TEMP TABLE temp_settings_backup AS
SELECT chave, valor FROM settings;

-- Dropar a tabela atual
DROP TABLE IF EXISTS public.settings CASCADE;

-- Criar nova tabela com estrutura adequada
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Configurações da loja
  store_name VARCHAR(255) DEFAULT 'Rebulliço',
  store_cnpj VARCHAR(18),
  store_address TEXT DEFAULT 'Rua da Moda, 123 - Centro',
  store_phone VARCHAR(20) DEFAULT '(11) 99999-9999',
  
  -- Configurações do sistema
  enable_rounding_to_05 BOOLEAN DEFAULT true,
  allow_price_edit_seller BOOLEAN DEFAULT false,
  receipt_footer TEXT DEFAULT 'Obrigado pela preferência! Trocas em até 7 dias.',
  
  -- Configurações de impostos e taxas
  default_tax_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Configurações de estoque
  low_stock_alert BOOLEAN DEFAULT true,
  auto_update_stock BOOLEAN DEFAULT true,
  
  -- Configurações de backup
  auto_backup BOOLEAN DEFAULT false,
  backup_frequency_days INTEGER DEFAULT 7,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Everyone can view settings" 
ON public.settings 
FOR SELECT 
USING (true);

CREATE POLICY "Gerente and admin can manage settings" 
ON public.settings 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['gerente'::text, 'admin'::text]));

-- Criar trigger para updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir registro único de configurações (singleton pattern)
INSERT INTO public.settings (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- Migrar dados existentes se houver
DO $$
DECLARE
    rec RECORD;
    setting_value TEXT;
BEGIN
    -- Migrar dados da tabela temporária
    FOR rec IN SELECT chave, valor FROM temp_settings_backup LOOP
        -- Remover aspas duplas do JSON
        setting_value := TRIM(BOTH '"' FROM rec.valor::text);
        
        CASE rec.chave
            WHEN 'store_name' THEN
                UPDATE public.settings SET store_name = setting_value WHERE id = '00000000-0000-0000-0000-000000000001';
            WHEN 'store_cnpj' THEN
                UPDATE public.settings SET store_cnpj = setting_value WHERE id = '00000000-0000-0000-0000-000000000001';
            WHEN 'store_address' THEN
                UPDATE public.settings SET store_address = setting_value WHERE id = '00000000-0000-0000-0000-000000000001';
            WHEN 'store_phone' THEN
                UPDATE public.settings SET store_phone = setting_value WHERE id = '00000000-0000-0000-0000-000000000001';
            WHEN 'enable_rounding_to_05' THEN
                UPDATE public.settings SET enable_rounding_to_05 = (setting_value = 'true') WHERE id = '00000000-0000-0000-0000-000000000001';
            WHEN 'allow_price_edit_seller' THEN
                UPDATE public.settings SET allow_price_edit_seller = (setting_value = 'true') WHERE id = '00000000-0000-0000-0000-000000000001';
            WHEN 'receipt_footer' THEN
                UPDATE public.settings SET receipt_footer = setting_value WHERE id = '00000000-0000-0000-0000-000000000001';
        END CASE;
    END LOOP;
END $$;

-- Limpar tabela temporária
DROP TABLE temp_settings_backup;

-- Criar função para obter configurações (singleton)
CREATE OR REPLACE FUNCTION get_settings()
RETURNS public.settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM settings WHERE id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
$$;

-- Criar função para atualizar configurações
CREATE OR REPLACE FUNCTION update_settings(
  p_store_name VARCHAR(255) DEFAULT NULL,
  p_store_cnpj VARCHAR(18) DEFAULT NULL,
  p_store_address TEXT DEFAULT NULL,
  p_store_phone VARCHAR(20) DEFAULT NULL,
  p_enable_rounding_to_05 BOOLEAN DEFAULT NULL,
  p_allow_price_edit_seller BOOLEAN DEFAULT NULL,
  p_receipt_footer TEXT DEFAULT NULL,
  p_default_tax_rate DECIMAL(5,2) DEFAULT NULL,
  p_low_stock_alert BOOLEAN DEFAULT NULL,
  p_auto_update_stock BOOLEAN DEFAULT NULL,
  p_auto_backup BOOLEAN DEFAULT NULL,
  p_backup_frequency_days INTEGER DEFAULT NULL
)
RETURNS public.settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result public.settings;
BEGIN
  UPDATE settings SET
    store_name = COALESCE(p_store_name, store_name),
    store_cnpj = COALESCE(p_store_cnpj, store_cnpj),
    store_address = COALESCE(p_store_address, store_address),
    store_phone = COALESCE(p_store_phone, store_phone),
    enable_rounding_to_05 = COALESCE(p_enable_rounding_to_05, enable_rounding_to_05),
    allow_price_edit_seller = COALESCE(p_allow_price_edit_seller, allow_price_edit_seller),
    receipt_footer = COALESCE(p_receipt_footer, receipt_footer),
    default_tax_rate = COALESCE(p_default_tax_rate, default_tax_rate),
    low_stock_alert = COALESCE(p_low_stock_alert, low_stock_alert),
    auto_update_stock = COALESCE(p_auto_update_stock, auto_update_stock),
    auto_backup = COALESCE(p_auto_backup, auto_backup),
    backup_frequency_days = COALESCE(p_backup_frequency_days, backup_frequency_days),
    updated_at = now()
  WHERE id = '00000000-0000-0000-0000-000000000001'
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;