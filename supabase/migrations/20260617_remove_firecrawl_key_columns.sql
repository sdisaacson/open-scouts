BEGIN;

-- Drop columns that stored per-user and custom Firecrawl API keys.
-- The application now uses a single FIRECRAWL_API_KEY environment variable
-- shared by all users.
ALTER TABLE user_preferences
  DROP COLUMN IF EXISTS firecrawl_api_key,
  DROP COLUMN IF EXISTS firecrawl_custom_api_key,
  DROP COLUMN IF EXISTS firecrawl_key_status,
  DROP COLUMN IF EXISTS firecrawl_key_created_at,
  DROP COLUMN IF EXISTS firecrawl_key_error;

-- Drop the now-unused index on firecrawl_key_status.
DROP INDEX IF EXISTS idx_user_preferences_firecrawl_status;

COMMIT;
