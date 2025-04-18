/*
  # Add company settings table
  
  1. New Tables
    - `company_settings` - Stores company information for invoices
      - `id` (uuid, primary key)
      - `name` (text)
      - `address_line1` (text)
      - `address_line2` (text)
      - `city` (text)
      - `state` (text)
      - `postal_code` (text)
      - `country` (text)
      - `phone` (text)
      - `email` (text)
      - `website` (text)
      - `tax_id` (text)
      - `logo_url` (text)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  phone text,
  email text,
  website text,
  tax_id text,
  logo_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users"
  ON company_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();