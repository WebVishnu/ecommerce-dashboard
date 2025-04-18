/*
  # Update customers table with additional fields

  1. Changes
    - Add address fields (address_line1, address_line2, city, state, postal_code, country)
    - Add business information (company_name, tax_id)
    - Add personal information (date_of_birth, gender)
    - Add notes field for additional information

  2. Security
    - Maintain existing RLS policies
*/

DO $$ BEGIN
  -- Add address fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'address_line1') THEN
    ALTER TABLE customers ADD COLUMN address_line1 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'address_line2') THEN
    ALTER TABLE customers ADD COLUMN address_line2 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN
    ALTER TABLE customers ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'state') THEN
    ALTER TABLE customers ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'postal_code') THEN
    ALTER TABLE customers ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'country') THEN
    ALTER TABLE customers ADD COLUMN country text;
  END IF;

  -- Add business information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_name') THEN
    ALTER TABLE customers ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tax_id') THEN
    ALTER TABLE customers ADD COLUMN tax_id text;
  END IF;

  -- Add personal information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'date_of_birth') THEN
    ALTER TABLE customers ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'gender') THEN
    ALTER TABLE customers ADD COLUMN gender text;
  END IF;

  -- Add notes field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'notes') THEN
    ALTER TABLE customers ADD COLUMN notes text;
  END IF;
END $$;