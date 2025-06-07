/*
  # Add Sales Returns Table

  1. New Tables
    - `sales_returns`
      - `id` (uuid, primary key)
      - `original_sale_id` (uuid, optional foreign key to sales)
      - `product_id` (uuid, optional foreign key to products)
      - `quantity_returned` (integer, optional)
      - `refund_amount` (numeric, refund amount)
      - `reason` (text, return reason)
      - `notes` (text, optional notes)
      - `timestamp` (timestamptz, when return occurred)
      - `location_id` (uuid, foreign key to locations)
      - `staff` (text, staff member handling return)
      - `created_at` (timestamptz, record creation time)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `sales_returns` table
    - Add policy for authenticated users to manage their own returns

  3. Indexes
    - Add indexes for efficient querying
*/

CREATE TABLE IF NOT EXISTS sales_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity_returned integer,
  refund_amount numeric NOT NULL CHECK (refund_amount >= 0),
  reason text NOT NULL CHECK (reason IN ('defective', 'wrong_item', 'customer_change_mind', 'damaged', 'expired', 'duplicate', 'other')),
  notes text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  staff text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  CONSTRAINT sales_returns_quantity_positive CHECK (quantity_returned IS NULL OR quantity_returned > 0),
  CONSTRAINT sales_returns_product_quantity_check CHECK (
    (product_id IS NOT NULL AND quantity_returned IS NOT NULL) OR 
    (product_id IS NULL AND quantity_returned IS NULL)
  )
);

-- Enable RLS
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their own returns
CREATE POLICY "Users can manage their own sales returns"
  ON sales_returns
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_returns_original_sale_id ON sales_returns(original_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_product_id ON sales_returns(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_location_id ON sales_returns(location_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_user_id ON sales_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_timestamp ON sales_returns(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_returns_reason ON sales_returns(reason);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_sales_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_returns_updated_at
  BEFORE UPDATE ON sales_returns
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_returns_updated_at();