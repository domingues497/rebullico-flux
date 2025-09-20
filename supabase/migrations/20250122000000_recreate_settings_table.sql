-- Recreate settings table with proper structure
-- Drop existing table and recreate with standardized field names

-- Drop existing policies first
DROP POLICY IF EXISTS "Everyone can view settings" ON public.settings;
DROP POLICY IF EXISTS "Gerente and admin can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can delete settings" ON public.settings;

-- Drop the existing settings table
DROP TABLE IF EXISTS public.settings CASCADE;

-- Create the new settings table with standardized structure
CREATE TABLE public.settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name text NOT NULL DEFAULT 'Rebulliço',
    store_cnpj text DEFAULT '',
    store_address text DEFAULT 'Rua da Moda, 123 - Centro',
    store_phone text DEFAULT '(11) 99999-9999',
    store_email text DEFAULT '',
    
    -- POS Configuration
    enable_rounding_to_05 boolean DEFAULT true,
    allow_price_edit_seller boolean DEFAULT false,
    auto_print_receipt boolean DEFAULT true,
    receipt_footer text DEFAULT 'Obrigado pela preferência! Trocas em até 7 dias.',
    
    -- Financial Settings
    default_tax_rate decimal(5,2) DEFAULT 0.00,
    currency_symbol text DEFAULT 'R$',
    
    -- Inventory Settings
    low_stock_alert boolean DEFAULT true,
    low_stock_threshold integer DEFAULT 10,
    auto_update_stock boolean DEFAULT true,
    track_inventory boolean DEFAULT true,
    
    -- System Settings
    auto_backup boolean DEFAULT false,
    backup_frequency_days integer DEFAULT 7,
    theme text DEFAULT 'light',
    language text DEFAULT 'pt-BR',
    
    -- Timestamps
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create get_user_role function (if not exists)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- For now, we'll return 'admin' for all authenticated users
  -- This can be enhanced later with a proper user roles system
  IF user_id IS NOT NULL THEN
    RETURN 'admin';
  ELSE
    RETURN 'anonymous';
  END IF;
END;
$$;

-- Create RLS policies for the new table
CREATE POLICY "Authenticated users can view settings" 
ON public.settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert settings" 
ON public.settings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update settings" 
ON public.settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete settings" 
ON public.settings 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT ALL ON public.settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings record
INSERT INTO public.settings (
    id,
    store_name,
    store_cnpj,
    store_address,
    store_phone,
    store_email,
    enable_rounding_to_05,
    allow_price_edit_seller,
    auto_print_receipt,
    receipt_footer,
    default_tax_rate,
    currency_symbol,
    low_stock_alert,
    low_stock_threshold,
    auto_update_stock,
    track_inventory,
    auto_backup,
    backup_frequency_days,
    theme,
    language
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Rebulliço',
    '',
    'Rua da Moda, 123 - Centro',
    '(11) 99999-9999',
    'contato@rebullico.com',
    true,
    false,
    true,
    'Obrigado pela preferência! Trocas em até 7 dias.',
    0.00,
    'R$',
    true,
    10,
    true,
    true,
    false,
    7,
    'light',
    'pt-BR'
);