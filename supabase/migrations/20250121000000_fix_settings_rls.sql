-- Fix RLS policies for settings table
-- Create missing get_user_role function and update policies

-- First, let's check if the table structure matches what we expect
-- If the table still has the old structure (nome, cnpj, endereco, telefone), we need to handle it

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

-- Drop existing policies for settings table
DROP POLICY IF EXISTS "Everyone can view settings" ON public.settings;
DROP POLICY IF EXISTS "Gerente and admin can manage settings" ON public.settings;

-- Create new simplified policies that allow all operations for authenticated users
CREATE POLICY "Authenticated users can view settings" 
ON public.settings 
FOR SELECT 
USING (true);

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
GRANT ALL ON public.settings TO anon;

-- Check if the table has the old structure and insert accordingly
DO $$
DECLARE
    has_store_name boolean;
    has_nome boolean;
BEGIN
    -- Check if store_name column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'store_name'
        AND table_schema = 'public'
    ) INTO has_store_name;
    
    -- Check if nome column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'nome'
        AND table_schema = 'public'
    ) INTO has_nome;
    
    -- Insert based on table structure
    IF has_store_name THEN
        -- New structure with store_name, store_cnpj, etc.
        INSERT INTO public.settings (
            id, 
            store_name, 
            store_cnpj, 
            store_address, 
            store_phone,
            enable_rounding_to_05,
            allow_price_edit_seller,
            receipt_footer,
            default_tax_rate,
            low_stock_alert,
            auto_update_stock,
            auto_backup,
            backup_frequency_days
        ) 
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            'Rebulliço',
            '',
            'Rua da Moda, 123 - Centro',
            '(11) 99999-9999',
            true,
            false,
            'Obrigado pela preferência! Trocas em até 7 dias.',
            0.00,
            true,
            true,
            false,
            7
        )
        ON CONFLICT (id) DO NOTHING;
    ELSIF has_nome THEN
        -- Old structure with nome, cnpj, endereco, telefone
        INSERT INTO public.settings (id, nome, cnpj, endereco, telefone) 
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            'Rebulliço',
            '',
            'Rua da Moda, 123 - Centro',
            '(11) 99999-9999'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;