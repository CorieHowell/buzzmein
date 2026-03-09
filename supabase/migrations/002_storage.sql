-- ============================================================
-- Buzz Me In — Storage Setup
-- Migration: 002_storage.sql
-- ============================================================

-- Create public covers bucket (topic/group cover images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload covers
CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'covers');

-- Anyone can view covers (public bucket)
CREATE POLICY "Public can view covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'covers');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'covers' AND owner_id = auth.uid()::text);
