ALTER TABLE "Event" ADD COLUMN "earlyScanMinutes" INTEGER;
ALTER TABLE "Event" ADD CONSTRAINT "Event_early_scan_minutes_check"
CHECK ("earlyScanMinutes" IS NULL OR "earlyScanMinutes" > 0);
