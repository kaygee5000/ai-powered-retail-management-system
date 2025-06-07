/*
  # Create sales table

  1. New Tables
    - `sales`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz, sale timestamp)
      - `location_id` (uuid, foreign key to locations)
      - `total` (numeric, sale total amount)
      - `items` (integer, number of items sold)
      - `staff` (text, staff member name)
      - `payment_method` (text, payment method used)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `sales` table
    - Add policy for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  total numeric NOT NULL CHECK (total >= 0),
  items integer NOT NULL DEFAULT 1 CHECK (items > 0),
  staff text NOT NULL,
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_location_id ON sales(location_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);