-- Create movement type enum
CREATE TYPE movement_type AS ENUM ('entrada', 'saida', 'ajuste');

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  tipo_movimento movement_type NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view stock movements" 
ON public.stock_movements 
FOR SELECT 
USING (true);

CREATE POLICY "Gerente and admin can manage stock movements" 
ON public.stock_movements 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['gerente'::text, 'admin'::text]));

-- Create function for stock entry
CREATE OR REPLACE FUNCTION public.update_stock_on_entry(p_variant_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update stock by adding the quantity
  UPDATE product_variants 
  SET estoque_atual = estoque_atual + p_quantity,
      updated_at = now()
  WHERE id = p_variant_id;
  
  -- Create stock movement record is handled by the calling function
END;
$$;

-- Create index for better performance
CREATE INDEX idx_stock_movements_variant_id ON public.stock_movements(product_variant_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);