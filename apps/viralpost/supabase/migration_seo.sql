-- SEO fields for carousel_posts
ALTER TABLE carousel_posts
  ADD COLUMN IF NOT EXISTS first_comment   text,
  ADD COLUMN IF NOT EXISTS hashtag_groups  jsonb;

-- Index for querying by hashtag groups
CREATE INDEX IF NOT EXISTS idx_carousel_posts_hashtag_groups
  ON carousel_posts USING gin (hashtag_groups);
