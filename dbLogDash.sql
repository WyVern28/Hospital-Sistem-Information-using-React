DROP DATABASE IF EXISTS anahita_hospital;

CREATE DATABASE anahita_hospital
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE anahita_hospital;

-- ======================
-- ROLES
-- ======================

CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- ======================
-- USERS
-- ======================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    role_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE,

    phone VARCHAR(20) UNIQUE,

    password VARCHAR(255) NOT NULL,

    photo VARCHAR(255),

    is_active BOOLEAN DEFAULT TRUE,

    last_login TIMESTAMP NULL,

    remember_token VARCHAR(100),

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL,

    FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
);

-- ======================
-- PATIENTS
-- ======================

CREATE TABLE patients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    medical_record_number VARCHAR(20) UNIQUE,

    nik VARCHAR(16) UNIQUE,

    birth_place VARCHAR(100),

    birth_date DATE,

    gender ENUM('Male','Female'),

    blood_type ENUM('A','B','AB','O'),

    address TEXT,

    emergency_contact VARCHAR(100),

    emergency_phone VARCHAR(20),

    allergies TEXT,

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL,

    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ======================
-- Specialties
-- ======================


CREATE TABLE specialties (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100),

    description TEXT
);

-- ======================
-- DOCTORS
-- ======================

CREATE TABLE doctors (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    specialty_id BIGINT UNSIGNED,

    license_number VARCHAR(50) UNIQUE,

    experience_years INT,

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL,

    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY(specialty_id)
        REFERENCES specialties(id)
        ON DELETE SET NULL
);

-- ======================
-- doctor_schedules
-- =====================

CREATE TABLE doctor_schedules (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    doctor_id BIGINT UNSIGNED,

    day ENUM(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ),

    start_time TIME,

    end_time TIME,

    quota INT,

    FOREIGN KEY(doctor_id)
        REFERENCES doctors(id)
);

CREATE TABLE appointments (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    patient_id BIGINT UNSIGNED,

    doctor_id BIGINT UNSIGNED,

    schedule_id BIGINT UNSIGNED,

    visit_date DATE,

    queue_number INT,

    complaint TEXT,

    status ENUM(
        'Waiting',
        'Checked',
        'Completed',
        'Cancelled'
    ),

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL,

    FOREIGN KEY(patient_id)
        REFERENCES patients(id),

    FOREIGN KEY(doctor_id)
        REFERENCES doctors(id),

    FOREIGN KEY(schedule_id)
        REFERENCES doctor_schedules(id)
);

CREATE TABLE medical_records (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    appointment_id BIGINT UNSIGNED,

    subjective TEXT,

    objective TEXT,

    assessment TEXT,

    plan TEXT,

    diagnosis TEXT,

    treatment TEXT,

    notes TEXT,

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL,

    FOREIGN KEY(appointment_id)
        REFERENCES appointments(id)
);

CREATE TABLE medicines (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100),

    stock INT,

    minimum_stock INT,

    unit VARCHAR(20),

    price DECIMAL(12,2),

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL
);

CREATE TABLE medicines (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100),

    stock INT,

    minimum_stock INT,

    unit VARCHAR(20),

    price DECIMAL(12,2),

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL
);

CREATE TABLE prescriptions (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    medical_record_id BIGINT UNSIGNED,

    notes TEXT,

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL,

    FOREIGN KEY(medical_record_id)
        REFERENCES medical_records(id)
);

CREATE TABLE prescription_details (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    prescription_id BIGINT UNSIGNED,

    medicine_id BIGINT UNSIGNED,

    quantity INT,

    dosage VARCHAR(100),

    instruction TEXT,

    FOREIGN KEY(prescription_id)
        REFERENCES prescriptions(id),

    FOREIGN KEY(medicine_id)
        REFERENCES medicines(id)
);

CREATE TABLE invoices (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    appointment_id BIGINT UNSIGNED,

    consultation_fee DECIMAL(12,2),

    medicine_fee DECIMAL(12,2),

    total DECIMAL(12,2),

    status ENUM(
        'Pending',
        'Paid'
    ),

    created_at TIMESTAMP NULL,

    updated_at TIMESTAMP NULL,

    FOREIGN KEY(appointment_id)
        REFERENCES appointments(id)
);

CREATE TABLE payments (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    invoice_id BIGINT UNSIGNED,

    payment_method ENUM(
        'Cash',
        'Transfer',
        'QRIS'
    ),

    amount DECIMAL(12,2),

    paid_at DATETIME,

    FOREIGN KEY(invoice_id)
        REFERENCES invoices(id)
);

-- ======================
-- AUDIT LOGS
-- ======================

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED,

    activity TEXT,

    ip_address VARCHAR(100),

    created_at TIMESTAMP NULL,

    FOREIGN KEY(user_id)
        REFERENCES users(id)
);

-- ======================
-- DEFAULT ROLES
-- ======================

INSERT INTO roles(name,description) VALUES
('Admin','Administrator'),
('Pasien','Patient'),
('Dokter','Doctor'),
('Perawat','Nurse'),
('Farmasi','Pharmacy'),
('Kasir','Cashier'),
('Pendaftaran','Registration Staff'),
('Manajemen','Management');