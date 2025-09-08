-- Comprehensive Performance Optimization Script
-- This script addresses the 30-40 second loading delays by optimizing database queries and adding performance enhancements
-- Run this script on your PostgreSQL database

-- ============================================
-- ANALYZE CURRENT PERFORMANCE
-- ============================================

-- Check current query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%homeworks%' OR query LIKE '%homework_files%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes and bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_returned(c.oid) as tuples_returned,
    pg_stat_get_tuples_fetched(c.oid) as tuples_fetched
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================

-- Composite index for homework files with latest flag (critical for file filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_homework_files_homework_latest_type 
ON homework_files(homework_id, is_latest, file_type) 
WHERE is_latest = true;

-- Index for homework files ordering by upload date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_homework_files_uploaded_at 
ON homework_files(uploaded_at DESC);

-- Composite index for change requests with status and creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_homework_change_requests_created_status 
ON homework_change_requests(created_at DESC, status);

-- Index for notifications with read status and creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, is_read, created_at DESC);

-- Partial index for unread notifications (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- ============================================
-- QUERY OPTIMIZATION VIEWS
-- ============================================

-- Create a materialized view for homework summary data (if needed for dashboards)
CREATE MATERIALIZED VIEW IF NOT EXISTS homework_summary AS
SELECT 
    h.id,
    h.student_id,
    h.agent_id,
    h.super_worker_id,
    h.worker_id,
    h.status,
    h.created_at,
    h.deadline,
    h.price,
    COUNT(hf.id) as file_count,
    COUNT(CASE WHEN hf.file_type = 'student_original' THEN 1 END) as original_files,
    COUNT(CASE WHEN hf.file_type = 'worker_draft' AND hf.is_latest THEN 1 END) as draft_files,
    COUNT(CASE WHEN hf.file_type = 'super_worker_review' AND hf.is_latest THEN 1 END) as review_files,
    COUNT(CASE WHEN hf.file_type = 'final_approved' AND hf.is_latest THEN 1 END) as final_files,
    COUNT(hcr.id) as change_request_count
FROM homeworks h
LEFT JOIN homework_files hf ON h.id = hf.homework_id
LEFT JOIN homework_change_requests hcr ON h.id = hcr.homework_id
GROUP BY h.id, h.student_id, h.agent_id, h.super_worker_id, h.worker_id, h.status, h.created_at, h.deadline, h.price;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_homework_summary_id ON homework_summary(id);
CREATE INDEX IF NOT EXISTS idx_homework_summary_student ON homework_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_summary_agent ON homework_summary(agent_id);
CREATE INDEX IF NOT EXISTS idx_homework_summary_super_worker ON homework_summary(super_worker_id);
CREATE INDEX IF NOT EXISTS idx_homework_summary_worker ON homework_summary(worker_id);

-- ============================================
-- DATABASE MAINTENANCE OPTIMIZATIONS
-- ============================================

-- Update table statistics for better query planning
ANALYZE homeworks;
ANALYZE homework_files;
ANALYZE homework_change_requests;
ANALYZE change_request_files;
ANALYZE notifications;
ANALYZE users;

-- Vacuum tables to reclaim space and update statistics
VACUUM ANALYZE homeworks;
VACUUM ANALYZE homework_files;
VACUUM ANALYZE homework_change_requests;
VACUUM ANALYZE notifications;

-- ============================================
-- POSTGRESQL CONFIGURATION RECOMMENDATIONS
-- ============================================

/*
Add these settings to your postgresql.conf file for better performance:

# Memory Settings
shared_buffers = 256MB                    # 25% of RAM for dedicated DB server
effective_cache_size = 1GB                # Estimate of OS cache size
work_mem = 8MB                            # Memory for sorting and hash operations
maintenance_work_mem = 128MB              # Memory for maintenance operations

# Connection Settings
max_connections = 100                     # Adjust based on your application needs

# Query Performance
random_page_cost = 1.1                   # Lower for SSD storage
effective_io_concurrency = 200            # Higher for SSD storage
max_worker_processes = 8                  # Number of CPU cores
max_parallel_workers_per_gather = 4       # Parallel query workers
max_parallel_workers = 8                  # Total parallel workers

# Write Performance
wal_buffers = 16MB                        # WAL buffer size
checkpoint_completion_target = 0.9        # Spread checkpoints over time
checkpoint_timeout = 10min                # Maximum time between checkpoints

# Logging for Performance Monitoring
log_min_duration_statement = 1000         # Log queries taking > 1 second
log_statement = 'mod'                     # Log all modifications
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Enable query statistics (requires restart)
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
*/

-- ============================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================

-- Monitor slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    (total_time/calls) as avg_time_ms
FROM pg_stat_statements 
WHERE mean_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_time DESC
LIMIT 20;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check for unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY tablename;

-- Monitor connection usage
SELECT 
    state,
    COUNT(*) as connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Check table bloat
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    CASE 
        WHEN n_live_tup > 0 
        THEN ROUND((n_dead_tup::float / n_live_tup::float) * 100, 2)
        ELSE 0 
    END as bloat_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY bloat_percentage DESC;

-- ============================================
-- REFRESH MATERIALIZED VIEW FUNCTION
-- ============================================

-- Function to refresh homework summary (call this periodically or after major updates)
CREATE OR REPLACE FUNCTION refresh_homework_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY homework_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION AND CLEANUP
-- ============================================

-- Verify all indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND (indexname LIKE 'idx_homework_files_%' 
         OR indexname LIKE 'idx_homework_change_requests_%'
         OR indexname LIKE 'idx_notifications_%')
ORDER BY tablename, indexname;

-- Show final table statistics
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

SELECT 'Performance optimization script completed successfully!' as status;