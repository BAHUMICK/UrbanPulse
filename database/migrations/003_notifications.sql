-- =============================================================================
-- Migration 003: In-App User Notifications and Issue Subscriptions
-- Platform: UrbanPulse - City Infrastructure Intelligence Platform
-- =============================================================================
BEGIN;

-- 1. Table: user_notifications
-- Stores in-app resolution and status alerts for citizens and administrators.
CREATE TABLE IF NOT EXISTS user_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'issue_resolved',
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id) WHERE is_read = FALSE;

-- Database-level Idempotency Constraint:
-- Guarantees no duplicate resolution notification can ever be generated for the
-- same user, issue, and notification type, even under concurrent status requests.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_issue_resolution_notification
    ON user_notifications(user_id, issue_id, notification_type);

-- 2. Table: issue_subscriptions
-- Allows civic users to explicitly follow an infrastructure issue in their neighborhood.
CREATE TABLE IF NOT EXISTS issue_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_issue_user_subscription UNIQUE(issue_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_subscriptions_user ON issue_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_subscriptions_issue ON issue_subscriptions(issue_id);

COMMIT;
