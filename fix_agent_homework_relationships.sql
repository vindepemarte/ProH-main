-- Fix Agent-Homework Relationships Migration
-- This script updates existing homeworks to properly set agent_id based on student referral relationships
-- Run this script to fix historical data where agent_id is null but should be set

-- Update homeworks where agent_id is null but student was referred by an agent or super_agent
UPDATE homeworks 
SET agent_id = (
    SELECT u.referred_by 
    FROM users u 
    WHERE u.id = homeworks.student_id 
    AND u.referred_by IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM users referrer 
        WHERE referrer.id = u.referred_by 
        AND referrer.role IN ('agent', 'super_agent')
    )
)
WHERE agent_id IS NULL
AND student_id IN (
    SELECT u.id 
    FROM users u 
    JOIN users referrer ON u.referred_by = referrer.id 
    WHERE referrer.role IN ('agent', 'super_agent')
);

-- Verify the update
SELECT 
    'Before Fix' as status,
    COUNT(*) as total_homeworks,
    COUNT(agent_id) as homeworks_with_agent,
    COUNT(*) - COUNT(agent_id) as homeworks_without_agent
FROM homeworks;

-- Show homeworks that still need agent_id (students not referred by agents/super_agents)
SELECT 
    h.id as homework_id,
    h.student_id,
    s.name as student_name,
    s.referred_by,
    r.name as referrer_name,
    r.role as referrer_role
FROM homeworks h
JOIN users s ON h.student_id = s.id
LEFT JOIN users r ON s.referred_by = r.id
WHERE h.agent_id IS NULL
ORDER BY h.created_at DESC;

-- Show summary of homework-agent relationships after fix
SELECT 
    r.role as referrer_role,
    COUNT(h.id) as homework_count
FROM homeworks h
JOIN users s ON h.student_id = s.id
JOIN users r ON s.referred_by = r.id
WHERE h.agent_id IS NOT NULL
GROUP BY r.role
ORDER BY homework_count DESC;