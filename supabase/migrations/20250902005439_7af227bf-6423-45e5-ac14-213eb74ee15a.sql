-- Create authentication function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_role_id UUID;
BEGIN
  -- Get seller role id (default role for new users)
  SELECT id INTO seller_role_id FROM public.roles WHERE name = 'seller';
  
  -- Insert profile for new user with seller role as default
  INSERT INTO public.profiles (id, name, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    seller_role_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roles if they don't exist
INSERT INTO public.roles (name) VALUES ('seller') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (name) VALUES ('manager') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (name) VALUES ('admin') ON CONFLICT DO NOTHING;

-- Create default customer group
INSERT INTO public.customer_groups (nome, desconto_percentual) 
VALUES ('Padrão', 0) ON CONFLICT DO NOTHING;

-- Insert default payment methods with fees
INSERT INTO public.acquirer_fees (bandeira, taxa_percentual, parcelas, taxa_fixa) VALUES
('Dinheiro', 0, 1, 0),
('PIX', 0, 1, 0),
('Débito', 3.5, 1, 0.30),
('Crédito', 4.2, 1, 0.30),
('Crédito', 5.5, 2, 0.30),
('Crédito', 6.8, 3, 0.30),
('Crédito', 7.2, 4, 0.30),
('Crédito', 7.8, 5, 0.30),
('Crédito', 8.2, 6, 0.30),
('Crédito', 8.8, 7, 0.30),
('Crédito', 9.2, 8, 0.30),
('Crédito', 9.8, 9, 0.30),
('Crédito', 10.2, 10, 0.30),
('Crédito', 10.8, 11, 0.30),
('Crédito', 11.5, 12, 0.30),
('Fiado', 0, 1, 0)
ON CONFLICT DO NOTHING;

-- Create view for stock balance calculation
CREATE OR REPLACE VIEW public.v_stock_balance AS
SELECT 
  pv.id as variant_id,
  pv.sku,
  pv.ean,
  p.nome as product_name,
  pv.tamanho,
  pv.cor,
  pv.preco_base,
  pv.estoque_atual,
  pv.estoque_minimo,
  CASE 
    WHEN pv.estoque_atual <= pv.estoque_minimo THEN true 
    ELSE false 
  END as is_low_stock
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
ORDER BY p.nome, pv.tamanho, pv.cor;

-- Insert system settings
INSERT INTO public.settings (chave, valor) VALUES
('store_name', '"Rebulliço"'),
('store_address', '"Rua da Moda, 123 - Centro"'),
('store_phone', '"(11) 99999-9999"'),
('receipt_footer', '"Obrigado pela preferência! Trocas em até 7 dias."'),
('allow_price_edit_seller', 'false'),
('enable_rounding_to_05', 'true')
ON CONFLICT (chave) DO NOTHING;