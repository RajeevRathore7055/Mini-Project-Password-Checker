USE securepass_db_final;

-- New table: breach_alerts
-- Stores IP of users whose passwords were found in breach
CREATE TABLE IF NOT EXISTS breach_alerts (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NULL,
    user_name     VARCHAR(100) NOT NULL,
    ip_address    VARCHAR(45)  NOT NULL,
    breach_count  INT          NOT NULL DEFAULT 0,
    password_hint VARCHAR(10)  NOT NULL,
    detected_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id   (user_id),
    INDEX idx_ip        (ip_address),
    INDEX idx_detected  (detected_at)
);

SELECT '✅ breach_alerts table created!' AS status;
