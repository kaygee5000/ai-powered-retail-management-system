/*
  # Add Currency and Country Settings

  1. Update user_settings table to include currency and country preferences
  2. Add these to the default settings for new users
*/

-- Add currency and country to the default ai_settings (reusing this column for now)
-- In a real app, you might want a dedicated "regional_settings" column
UPDATE user_settings 
SET ai_settings = ai_settings || jsonb_build_object(
  'currency', 'USD',
  'country', 'US'
)
WHERE ai_settings IS NOT NULL;

-- Update the default value for new users
ALTER TABLE user_settings 
ALTER COLUMN ai_settings 
SET DEFAULT '{
  "language": "en",
  "timezone": "America/New_York",
  "enableVoiceInput": true,
  "autoProcessReports": true,
  "confidenceThreshold": 85,
  "currency": "USD",
  "country": "US"
}'::jsonb;