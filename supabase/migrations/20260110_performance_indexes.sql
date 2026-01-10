-- Performance Optimization: Add indexes for frequently queried columns
-- Issue: Missing indexes on consultation_status and last_status_change causing full table scans
-- Impact: Dramatic performance improvement for queue filtering and status-based queries

-- Index for consultation status filtering (waiting, in_consultation, served)
CREATE INDEX IF NOT EXISTS idx_patients_consultation_status
ON patients(consultation_status)
WHERE consultation_status IS NOT NULL;

-- Index for last status change timestamp (used for date filtering)
CREATE INDEX IF NOT EXISTS idx_patients_last_status_change
ON patients(last_status_change DESC)
WHERE last_status_change IS NOT NULL;

-- Composite index for common query pattern (status + date filtering)
CREATE INDEX IF NOT EXISTS idx_patients_status_date
ON patients(consultation_status, last_status_change DESC)
WHERE consultation_status IS NOT NULL;

-- Index for created_at to optimize queue ordering (FIFO)
CREATE INDEX IF NOT EXISTS idx_patients_created_at
ON patients(created_at DESC);

-- Comment explaining the optimization
COMMENT ON INDEX idx_patients_consultation_status IS 'Optimizes queue filtering by consultation status';
COMMENT ON INDEX idx_patients_last_status_change IS 'Optimizes date-based filtering for patient history';
COMMENT ON INDEX idx_patients_status_date IS 'Composite index for status + date queries in dashboards';
COMMENT ON INDEX idx_patients_created_at IS 'Optimizes FIFO queue ordering';
