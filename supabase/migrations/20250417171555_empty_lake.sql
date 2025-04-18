/*
  # Add initial stock to products

  1. New Columns
    - Add initial_stock column to products table
    - Add minimum_stock column to products table

  2. Constraints
    - Ensure initial_stock and minimum_stock are not negative
*/

-- Add new columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS initial_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_stock integer NOT NULL DEFAULT 5;

-- Add constraints to ensure stock values are not negative
ALTER TABLE products 
  ADD CONSTRAINT initial_stock_not_negative 
  CHECK (initial_stock >= 0);

ALTER TABLE products 
  ADD CONSTRAINT minimum_stock_not_negative 
  CHECK (minimum_stock >= 0);