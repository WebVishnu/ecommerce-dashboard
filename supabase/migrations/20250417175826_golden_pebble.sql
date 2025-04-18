/*
  # Add Admin Actions Tracking

  1. Changes
    - Add triggers for customer and category actions
    - Create function to log admin actions
    - Update existing triggers for better descriptions

  2. Security
    - Enable RLS on admin_actions table
    - Add policies for authenticated users
*/

-- Function to handle admin action logging
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
  action_description TEXT;
  entity_name TEXT;
BEGIN
  -- Get the entity name based on the table
  CASE TG_TABLE_NAME
    WHEN 'customers' THEN
      entity_name := NEW.name;
    WHEN 'categories' THEN
      entity_name := NEW.name;
    WHEN 'products' THEN
      entity_name := NEW.name;
    ELSE
      entity_name := 'Unknown';
  END CASE;

  -- Set action description based on operation
  CASE TG_OP
    WHEN 'INSERT' THEN
      action_description := 'Created new ' || TG_TABLE_NAME || ' - ' || entity_name;
    WHEN 'UPDATE' THEN
      action_description := 'Updated ' || TG_TABLE_NAME || ' - ' || entity_name;
    WHEN 'DELETE' THEN
      action_description := 'Deleted ' || TG_TABLE_NAME || ' - ' || entity_name;
  END CASE;

  -- Insert the admin action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    entity_type,
    entity_id,
    description
  ) VALUES (
    auth.uid(),
    LOWER(TG_OP),
    TG_TABLE_NAME,
    CASE TG_OP
      WHEN 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    action_description
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for customers
DROP TRIGGER IF EXISTS log_customer_changes ON customers;
CREATE TRIGGER log_customer_changes
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Triggers for categories
DROP TRIGGER IF EXISTS log_category_changes ON categories;
CREATE TRIGGER log_category_changes
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Update product triggers to use the new logging function
DROP TRIGGER IF EXISTS log_product_changes ON products;
CREATE TRIGGER log_product_changes
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Enable RLS on admin_actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Policies for admin_actions
CREATE POLICY "Allow authenticated users to view admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create admin actions"
  ON admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);