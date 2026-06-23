-- Add payload column to jobs table for async worker data
ALTER TABLE jobs ADD COLUMN payload_json TEXT;
