-- Cleanup old active games that are likely abandoned
-- This script marks games as Abandoned if they are Active but haven't been updated in over 1 hour

UPDATE "Games"
SET "Status" = 3  -- Abandoned
WHERE "Status" = 1  -- Active
  AND "StartedAt" < NOW() - INTERVAL '1 hour'
  AND "CompletedAt" IS NULL;

-- Show how many games were updated
SELECT COUNT(*) as "AbandonedGamesCount"
FROM "Games"
WHERE "Status" = 3;
