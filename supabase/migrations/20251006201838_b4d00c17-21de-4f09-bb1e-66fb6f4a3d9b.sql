-- Adicionar novos campos na tabela suppliers
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS nome_vendedor TEXT,
ADD COLUMN IF NOT EXISTS telefone_vendedor TEXT,
ADD COLUMN IF NOT EXISTS email_vendedor TEXT,
ADD COLUMN IF NOT EXISTS formas_pagamento TEXT[],
ADD COLUMN IF NOT EXISTS limite_credito DECIMAL(10,2);