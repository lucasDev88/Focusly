CREATE UNIQUE INDEX "StudySession_one_active_or_paused_per_user"
ON "StudySession" ("userId")
WHERE "status" IN ('ACTIVE', 'PAUSED');