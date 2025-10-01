-- Add cod_interno column to products table
ALTER TABLE products ADD COLUMN cod_interno TEXT NOT NULL DEFAULT '';

-- Update existing products with a default value
UPDATE products SET cod_interno = 'PROD-' || id::text WHERE cod_interno = '';

-- Remove the default value constraint after updating existing records
ALTER TABLE products ALTER COLUMN cod_interno DROP DEFAULT;