-- Make url field nullable to support dual image sources
ALTER TABLE public.product_images 
ALTER COLUMN url DROP NOT NULL;

-- Add constraint to ensure at least one URL type is provided
ALTER TABLE public.product_images 
ADD CONSTRAINT check_image_url_provided 
CHECK (url IS NOT NULL OR url_link IS NOT NULL);