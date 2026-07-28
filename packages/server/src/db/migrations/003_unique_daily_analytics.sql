DELETE FROM analytics_events
WHERE id NOT IN (
  SELECT MIN(id)
  FROM analytics_events
  GROUP BY announcement_id, event_type, ip_hash, date(created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_unique_daily
ON analytics_events(announcement_id, event_type, ip_hash, date(created_at));
