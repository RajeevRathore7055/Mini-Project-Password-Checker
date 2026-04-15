-- ============================================================
-- SecurePass Database Schema
-- Run this file once before starting the Flask server
-- Command: mysql -u root -p < database/schema.sql
-- ============================================================

-- Create and select database
CREATE DATABASE IF NOT EXISTS securepass_db_final CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE securepass_db_final;

-- ── Table 1: users ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role  (role)
);

-- ── Table 2: login_logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_logs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NULL,
    ip_address   VARCHAR(45)  NOT NULL,
    user_agent   TEXT         NULL,
    status       ENUM('success', 'failed') NOT NULL,
    attempt_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_flagged   BOOLEAN      NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id   (user_id),
    INDEX idx_ip        (ip_address),
    INDEX idx_flagged   (is_flagged),
    INDEX idx_attempt_at(attempt_at)
);

-- ── Table 3: scan_history ────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_history (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT          NULL,
    rule_score     INT          NOT NULL,
    rule_label     VARCHAR(10)  NOT NULL,
    ml_label       VARCHAR(10)  NOT NULL,
    ml_confidence  FLOAT        NOT NULL,
    entropy        FLOAT        NOT NULL,
    is_breached    BOOLEAN      NULL DEFAULT NULL,
    breach_count   INT          NULL DEFAULT NULL,
    scanned_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id  (user_id),
    INDEX idx_scanned  (scanned_at)
);

-- ── Default Admin User ────────────────────────────────────────
-- Password: Admin@123 (bcrypt hashed)
-- Change this password after first login!
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
    'Admin',
    'admin@securepass.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oI8II4yma',
    'admin'
);

SELECT '✅ SecurePass database setup complete!' AS status;
