/*
  # Enhance product variants and inventory management

  1. Changes
    - Add minimum_quantity to product_variants table
    - Add price to product_variants table
    - Add is_default flag to product_variants table
    - Add variant_name to product_variants table for better organization

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to product_variants table
ALTER TABLE product_variants 
  ADD COLUMN IF NOT EXISTS minimum_quantity integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS variant_name text;

-- Add a constraint to ensure minimum_quantity is not negative
ALTER TABLE product_variants 
  ADD CONSTRAINT minimum_quantity_not_negative 
  CHECK (minimum_quantity >= 0);

-- Add a constraint to ensure price is not negative
ALTER TABLE product_variants 
  ADD CONSTRAINT price_not_negative 
  CHECK (price >= 0);

-- Add a unique constraint to ensure only one default variant per product
ALTER TABLE product_variants 
  ADD CONSTRAINT one_default_variant_per_product 
  UNIQUE (product_id, is_default) 
  WHERE (is_default = true);

-- Create an index for faster variant lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
  ON product_variants(product_id);