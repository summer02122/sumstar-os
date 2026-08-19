-- Add custom branding settings to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT;
