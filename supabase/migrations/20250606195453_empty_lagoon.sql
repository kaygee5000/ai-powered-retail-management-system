/*
  # Set Ghana as Default Country and Currency

  1. Changes
    - Update existing users to use Ghana Cedi (GHS) and Ghana (GH) as defaults
    - Update the default ai_settings column to use Ghana Cedi and Ghana
    - Preserve existing user preferences if they have already customized their settings
*/

-- Update existing users who still have the old USD/US defaults to use Ghana defaults
UPDATE user_settings 
SET ai_settings = ai_settings || jsonb_build_object(
  'currency', 'GHS',
  'country', 'GH'
)
WHERE (ai_settings->>'currency' = 'USD' OR ai_settings->>'currency' IS NULL)
   OR (ai_settings->>'country' = 'US' OR ai_settings->>'country' IS NULL);

-- Update the default value for new users to use Ghana Cedi and Ghana
ALTER TABLE user_settings 
ALTER COLUMN ai_settings 
SET DEFAULT '{
  "language": "en",
  "timezone": "Africa/Accra",
  "enableVoiceInput": true,
  "autoProcessReports": true,
  "confidenceThreshold": 85,
  "currency": "GHS",
  "country": "GH"
}'::jsonb;