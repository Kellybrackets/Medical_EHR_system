-- ========================================
-- ADD ADMIN ROLE AND PRACTICES TABLE
-- ========================================
-- This migration adds admin role support and practices management

-- ========================================
-- 1. UPDATE USERS TABLE TO SUPPORT ADMIN ROLE
-- ========================================

-- Drop the existing role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes admin
ALTER TABLE users ADD CONSTRAINT users_role_check
CHECK (role IN ('doctor', 'receptionist', 'admin'));

-- Add practice_code to users table (nullable for backwards compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS practice_code VARCHAR(20);

-- ========================================
-- 2. CREATE PRACTICES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS practices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. INSERT DEFAULT PRACTICES
-- ========================================

INSERT INTO practices (name, code, address, city, phone, status) VALUES
('City General Hospital', 'CGH001', '123 Main Street, City Center', 'City Center', '011-123-4567', 'active'),
('Family Wellness Clinic', 'FWC002', '456 Oak Avenue, Suburb', 'Suburb', '011-234-5678', 'active'),
('Downtown Medical Center', 'DMC003', '789 Pine Road, Downtown', 'Downtown', '011-345-6789', 'active')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- 4. ADD FOREIGN KEY FROM USERS TO PRACTICES
-- ========================================

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_practice_code ON users(practice_code);

-- Add foreign key constraint (SET NULL on delete to preserve user records)
ALTER TABLE users
ADD CONSTRAINT users_practice_code_fkey
FOREIGN KEY (practice_code) REFERENCES practices(code)
ON DELETE SET NULL;

-- ========================================
-- 5. ADD UPDATED_AT TRIGGER FOR PRACTICES
-- ========================================

CREATE TRIGGER update_practices_updated_at
    BEFORE UPDATE ON practices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. ROW LEVEL SECURITY FOR PRACTICES
-- ========================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view practices
CREATE POLICY "Authenticated users can view practices" ON practices
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert practices
CREATE POLICY "Admins can insert practices" ON practices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update practices
CREATE POLICY "Admins can update practices" ON practices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete practices
CREATE POLICY "Admins can delete practices" ON practices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- 7. UPDATE RLS POLICIES FOR USER MANAGEMENT
-- ========================================

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users admin_check
            WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
        )
    );

-- Admins can update any user (for suspending, role changes, etc)
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users admin_check
            WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
        )
    );

-- ========================================
-- 8. CREATE SYSTEM SETTINGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean')),
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('system_name', 'MedCare EHR', 'string', 'Name of the EHR system'),
('require_strong_password', 'true', 'boolean', 'Require strong passwords for user accounts'),
('session_timeout', '30', 'number', 'Session timeout in minutes'),
('max_login_attempts', '5', 'number', 'Maximum failed login attempts before lockout'),
('enable_audit_log', 'true', 'boolean', 'Enable audit logging for admin actions')
ON CONFLICT (setting_key) DO NOTHING;

-- RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view settings" ON system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON system_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- 9. CREATE AUDIT LOG TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert audit logs (for triggers)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE practices IS 'Medical practices/facilities in the system';
COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON TABLE audit_logs IS 'Audit trail of admin actions';

COMMENT ON COLUMN users.practice_code IS 'Links user to their medical practice';
COMMENT ON COLUMN practices.status IS 'Active practices appear in registration, inactive are hidden';
