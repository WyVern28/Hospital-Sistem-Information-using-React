DROP DATABASE IF EXISTS anahita_hospital;

CREATE DATABASE anahita_hospital
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE anahita_hospital;

-- =====================================
-- ROLES
-- =====================================

CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================
-- USERS
-- =====================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    role_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    phone VARCHAR(20),

    password VARCHAR(255) NOT NULL,

    photo VARCHAR(255) DEFAULT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    last_login DATETIME DEFAULT NULL,

    remember_token VARCHAR(100) DEFAULT NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY(role_id)
        REFERENCES roles(id)
);

-- =====================================
-- AUDIT LOG
-- =====================================

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    activity VARCHAR(255),

    ip_address VARCHAR(45),

    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================
-- DASHBOARD STATS
-- =====================================

CREATE TABLE dashboard_stats (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    total_patients INT DEFAULT 0,

    total_doctors INT DEFAULT 0,

    total_nurses INT DEFAULT 0,

    total_pharmacists INT DEFAULT 0,

    total_cashiers INT DEFAULT 0,

    total_appointments INT DEFAULT 0,

    total_income DECIMAL(15,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================
-- INSERT ROLES
-- =====================================

INSERT INTO roles(name, description) VALUES
('Admin','Administrator'),
('Pasien','Patient'),
('Dokter','Doctor'),
('Perawat','Nurse'),
('Farmasi','Pharmacy'),
('Kasir','Cashier'),
('Pendaftaran','Registration Staff'),
('Manajemen','Management');

-- =====================================
-- DEFAULT ADMIN
-- password = password
-- hash bcrypt Laravel
-- =====================================

INSERT INTO users
(
role_id,
name,
email,
phone,
password
)
VALUES
(
1,
'Administrator',
'admin@anahita.com',
'081234567890',
'$2y$12$KIXIDu7M4sN5lV6w6xG5F.v7S7Ff4qvP4dM5v6K1J7FQ2gk5GQYMe'
);

-- =====================================
-- DEFAULT DASHBOARD
-- =====================================

INSERT INTO dashboard_stats
(
total_patients,
total_doctors,
total_nurses,
total_pharmacists,
total_cashiers,
total_appointments,
total_income
)
VALUES
(
0,
0,
0,
0,
0,
0,
0
);