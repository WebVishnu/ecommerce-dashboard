/*
  # Fix RLS policies for company settings and storage

  1. Changes
    - Update RLS policy for company_settings table to allow authenticated users to manage settings
    - Add RLS policy for company storage bucket to allow authenticated users to upload files

  2. Security
    - Enable RLS on company_settings table
    - Add policies for authenticated users to:
      - Select company settings
      - Insert company settings
      - Update company settings
    - Add storage policies for authenticated users to:
      - Upload files
      - Read files
*/

-- Update company_settings table policies
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update company settings" ON company_settings;

CREATE POLICY "Allow authenticated users to view company settings"
ON company_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert company settings"
ON company_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update company settings"
ON company_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name)
  VALUES ('company', 'company')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Update storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload company files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view company files" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload company files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company'
);

CREATE POLICY "Allow authenticated users to view company files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company'
);