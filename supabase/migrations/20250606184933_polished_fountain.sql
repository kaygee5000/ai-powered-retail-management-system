/*
  # Create user settings table

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `profile_data` (jsonb) - stores profile information
      - `notification_preferences` (jsonb) - stores notification settings
      - `ai_settings` (jsonb) - stores AI configuration
      - `security_settings` (jsonb) - stores security preferences
      - `appearance_settings` (jsonb) - stores UI/theme preferences
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for users to manage their own settings
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_data jsonb DEFAULT '{}',
  notification_preferences jsonb DEFAULT '{
    "lowStock": true,
    "highSales": true,
    "unusualActivity": true,
    "dailyReports": false,
    "weeklyReports": true,
    "emailNotifications": true,
    "smsNotifications": false,
    "pushNotifications": true
  }',
  ai_settings jsonb DEFAULT '{
    "confidenceThreshold": 85,
    "autoProcessReports": true,
    "enableVoiceInput": true,
    "language": "en",
    "timezone": "America/New_York"
  }',
  security_settings jsonb DEFAULT '{
    "twoFactorAuth": false,
    "passwordExpiry": 90,
    "sessionTimeout": 30,
    "loginAttempts": 5
  }',
  appearance_settings jsonb DEFAULT '{
    "theme": "light",
    "primaryColor": "blue",
    "compactMode": false
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique constraint on user_id
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_key ON user_settings(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();