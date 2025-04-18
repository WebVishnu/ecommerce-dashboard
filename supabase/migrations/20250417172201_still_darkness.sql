/*
  # Add delivery address and charges to orders

  1. New Columns
    - `delivery_address_line1` (text)
    - `delivery_address_line2` (text)
    - `delivery_city` (text)
    - `delivery_state` (text)
    - `delivery_postal_code` (text)
    - `delivery_country` (text)
    - `subtotal_amount` (numeric)
    - `tax_amount` (numeric)
    - `shipping_amount` (numeric)
    - `discount_amount` (numeric)
    - `total_amount` (numeric)

  2. Changes
    - Rename existing total_amount to subtotal_amount
    - Add new total_amount that includes all charges
    - Add constraints to ensure amounts are not negative
*/

-- First rename the existing total_amount to subtotal_amount
ALTER TABLE orders RENAME COLUMN total_amount TO subtotal_amount;

-- Add delivery address fields
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_address_line1 text,
  ADD COLUMN IF NOT EXISTS delivery_address_line2 text,
  ADD COLUMN IF NOT EXISTS delivery_city text,
  ADD COLUMN IF NOT EXISTS delivery_state text,
  ADD COLUMN IF NOT EXISTS delivery_postal_code text,
  ADD COLUMN IF NOT EXISTS delivery_country text;

-- Add charge fields
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tax_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric GENERATED ALWAYS AS (
    subtotal_amount + tax_amount + shipping_amount - discount_amount
  ) STORED;

-- Add constraints
ALTER TABLE orders
  ADD CONSTRAINT subtotal_amount_not_negative CHECK (subtotal_amount >= 0),
  ADD CONSTRAINT tax_amount_not_negative CHECK (tax_amount >= 0),
  ADD CONSTRAINT shipping_amount_not_negative CHECK (shipping_amount >= 0),
  ADD CONSTRAINT discount_amount_not_negative CHECK (discount_amount >= 0);