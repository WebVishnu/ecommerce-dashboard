/*
  # Add product image support

  1. Schema Changes
    - Add `image_url` column to `products` table to store image URLs
  
  2. Storage
    - Create `products` bucket for storing product images
    - Set up storage policies to allow authenticated users to manage product images
*/

-- Add image_url column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url text;

-- Create products storage bucket and policies
DO $$
BEGIN
  -- Create the bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name)
  VALUES ('products', 'products')
  ON CONFLICT (id) DO NOTHING;

  -- Policy for authenticated users to read product images
  CREATE POLICY "Authenticated users can read product images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'products');

  -- Policy for authenticated users to upload product images
  CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

  -- Policy for authenticated users to update their uploaded images
  CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products');

  -- Policy for authenticated users to delete product images
  CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');
END $$;