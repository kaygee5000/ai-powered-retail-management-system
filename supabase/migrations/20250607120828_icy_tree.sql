/*
  # Add Inventory Adjustments Table

  1. New Tables
    - `inventory_adjustments`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `quantity_change` (integer, can be positive or negative)
      - `reason` (text, adjustment reason)
      - `notes` (text, optional notes)
      - `timestamp` (timestamptz, when adjustment occurred)
      - `created_at` (timestamptz, record creation time)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `inventory_adjustments` table
    - Add policy for authenticated users to manage their own adjustments

  3. Indexes
    - Add index on product_id for faster lookups
    - Add index on user_id for user-specific queries
    - Add index on timestamp for date-based filtering
*/

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_change integer NOT NULL,
  reason text NOT NULL CHECK (reason IN ('damaged', 'expired', 'theft', 'restock', 'recount', 'promotion', 'transfer', 'other')),
  notes text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  CONSTRAINT inventory_adjustments_quantity_change_check CHECK (quantity_change != 0)
);

-- Enable RLS
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their own adjustments
CREATE POLICY "Users can manage their own inventory adjustments"
  ON inventory_adjustments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_user_id ON inventory_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_timestamp ON inventory_adjustments(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_reason ON inventory_adjustments(reason);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_inventory_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_adjustments_updated_at
  BEFORE UPDATE ON inventory_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_adjustments_updated_at();