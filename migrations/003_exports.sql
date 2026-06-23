-- Export history
CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  format TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_exports_user ON exports(user_id, created_at DESC);
