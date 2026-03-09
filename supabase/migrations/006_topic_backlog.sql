-- Migration 006: Add 'backlog' as a valid topic status

-- Drop existing check constraint and re-add with 'backlog' included
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_status_check;

ALTER TABLE topics ADD CONSTRAINT topics_status_check
  CHECK (status IN ('backlog', 'nominated', 'current', 'completed'));
