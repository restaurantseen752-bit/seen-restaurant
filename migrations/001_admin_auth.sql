-- Migration 001: Admin authentication system
-- Date: 2026-10-24
-- Purpose: Replace plain-text admin password with hashed password + session tokens
--
-- IMPORTANT:
--   * This migration only CREATES new tables.
--   * It does NOT touch any existing table (items, categories, settings, orders, etc.)
--   * Safe to run multiple times (uses IF NOT EXISTS).
--   * Rollback: DROP TABLE admin_sessions; DROP TABLE admin_credentials;

-- Table 1: Single-row table storing the admin password (hashed + salted)
CREATE TABLE IF NOT EXISTS admin_credentials (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Table 2: Active admin sessions (one row per logged-in device)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL
);

-- Index to speed up cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires
  ON admin_sessions(expires_at);
