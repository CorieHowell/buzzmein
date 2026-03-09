-- Migration: 008_message_board
-- Adds parent_id (for thread replies) and image_url (for post attachments) to messages.
-- Top-level posts have parent_id IS NULL.
-- Replies have parent_id = <post_id>. Only one level of threading is supported.

ALTER TABLE messages
  ADD COLUMN parent_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  ADD COLUMN image_url text;

-- Index for fetching replies by parent
CREATE INDEX messages_parent_id_idx ON messages(parent_id);

-- Partial index for efficiently fetching top-level posts per group
CREATE INDEX messages_group_thread_idx ON messages(group_id, created_at DESC)
  WHERE parent_id IS NULL;
