/*
  # Create reports table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz, report timestamp)
      - `location_id` (uuid, foreign key to locations)
      - `staff` (text, staff member name)
      - `raw_text` (text, original report text)
      - `parsed_data` (jsonb, AI-parsed data)
      - `confidence` (numeric, AI confidence score)
      - `status` (enum, processing status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `reports` table
    - Add policy for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  staff text NOT NULL,
  raw_text text NOT NULL,
  parsed_data jsonb DEFAULT '{}',
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1) DEFAULT 0,
  status text CHECK (status IN ('processed', 'pending', 'flagged')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reports"
  ON reports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_location_id ON reports(location_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON reports(timestamp);