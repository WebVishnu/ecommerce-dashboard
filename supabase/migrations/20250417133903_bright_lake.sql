/*
  # E-commerce Database Schema

  1. New Tables
    - categories
      - id (uuid, primary key)
      - name (text)
      - parent_id (uuid, self-referential foreign key)
      - icon_url (text)
      - created_at (timestamp)
      - updated_at (timestamp)

    - products
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - sku (text, unique)
      - price (decimal)
      - category_id (uuid, foreign key)
      - created_at (timestamp)
      - updated_at (timestamp)

    - product_variants
      - id (uuid, primary key)
      - product_id (uuid, foreign key)
      - size (text)
      - color (text)
      - quantity (integer)
      - created_at (timestamp)
      - updated_at (timestamp)

    - customers
      - id (uuid, primary key)
      - name (text)
      - email (text, unique)
      - phone (text)
      - created_at (timestamp)
      - updated_at (timestamp)

    - orders
      - id (uuid, primary key)
      - customer_id (uuid, foreign key)
      - status (text)
      - total_amount (decimal)
      - created_at (timestamp)
      - updated_at (timestamp)

    - order_items
      - id (uuid, primary key)
      - order_id (uuid, foreign key)
      - product_id (uuid, foreign key)
      - variant_id (uuid, foreign key)
      - quantity (integer)
      - price (decimal)
      - created_at (timestamp)

    - admin_actions
      - id (uuid, primary key)
      - admin_id (uuid, foreign key)
      - action_type (text)
      - entity_type (text)
      - entity_id (uuid)
      - description (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id),
  icon_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text UNIQUE NOT NULL,
  price decimal NOT NULL,
  category_id uuid REFERENCES categories(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_variants table
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  size text,
  color text,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  status text NOT NULL DEFAULT 'pending',
  total_amount decimal NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  quantity integer NOT NULL,
  price decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create admin_actions table
CREATE TABLE admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users" ON categories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON products
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON product_variants
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON customers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON orders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON order_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON admin_actions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();