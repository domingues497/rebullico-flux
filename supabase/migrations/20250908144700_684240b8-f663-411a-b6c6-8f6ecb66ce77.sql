-- Fix RLS policies for product creation and add auto increment for internal codes

-- Allow vendedores to create products
CREATE POLICY "Vendedores can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::text, 'gerente'::text, 'admin'::text]));

-- Allow vendedores to create product variants  
CREATE POLICY "Vendedores can create product variants" 
ON public.product_variants 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::text, 'gerente'::text, 'admin'::text]));

-- Allow vendedores to create product images
CREATE POLICY "Vendedores can create product images" 
ON public.product_images 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::text, 'gerente'::text, 'admin'::text]));

-- Create sequence for auto increment internal codes
CREATE SEQUENCE IF NOT EXISTS public.product_code_seq START 1;

-- Function to generate auto internal code
CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'COD' || LPAD(nextval('product_code_seq')::TEXT, 6, '0');
END;
$$;

-- Add URL column to product_images for dual image support
ALTER TABLE public.product_images 
ADD COLUMN IF NOT EXISTS url_link TEXT;

-- Update product_images to support both file uploads and URL links
COMMENT ON COLUMN public.product_images.url IS 'File upload URL from storage';
COMMENT ON COLUMN public.product_images.url_link IS 'Direct image URL link';