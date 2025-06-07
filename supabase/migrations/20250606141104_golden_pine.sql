/*
  # Create locations table

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, location name)
      - `address` (text, physical address)
      - `manager` (text, manager name)
      - `status` (enum, active/inactive/attention)
      - `sales` (numeric, current sales amount)
      - `inventory` (numeric, inventory value)
      - `last_report` (text, last report time)
      - `alerts` (integer, number of alerts)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `locations` table
    - Add policy for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  manager text NOT NULL,
  status text CHECK (status IN ('active', 'inactive', 'attention')) DEFAULT 'active',
  sales numeric DEFAULT 0,
  inventory numeric DEFAULT 0,
  last_report text DEFAULT 'Never',
  alerts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();