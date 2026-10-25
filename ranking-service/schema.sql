CREATE TABLE IF NOT EXISTS submissions (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 score INTEGER NOT NULL,
 level INTEGER NOT NULL,
 ip_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS submissions_by_score ON submissions(score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS submissions_by_ip ON submissions(ip_hash, created_at DESC);
