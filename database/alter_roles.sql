USE securepass_db_final;

-- Add superadmin to role enum
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user';

-- Create default superadmin account
-- Email: superadmin@securepass.com
-- Password: SuperAdmin@123
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
    'Super Admin',
    'superadmin@securepass.com',
    '$2b$12$n.vhVMrcvy4kk4WVGRo3JO34pWbZnoUaWl2gGolEcf1NiPpLD8XAm',
    'superadmin'
);

SELECT '✅ Super Admin setup complete!' AS status;
SELECT name, email, role FROM users;
