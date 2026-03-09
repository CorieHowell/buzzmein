-- ============================================================
-- Buzz Me In — Migration 007
-- Enable Realtime on messages table
-- ============================================================

-- Add messages table to the Supabase Realtime publication
-- so clients can subscribe to new messages via postgres_changes
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
