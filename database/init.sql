-- Create Database
CREATE DATABASE IF NOT EXISTS university_db;
USE university_db;

-- 1. Users Table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Student', 'Instructor', 'Admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments Table
CREATE TABLE Departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL
);

-- 3. Students Table
CREATE TABLE Students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    major_id INT,
    total_credits INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (major_id) REFERENCES Departments(id)
);

-- 4. Courses Table
CREATE TABLE Courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES Departments(id)
);

-- 5. Schedules (Sections) Table
CREATE TABLE Schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    days VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL,
    enrolled_count INT DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES Courses(id)
);

-- 6. Registrations Table (The Core Transaction Table)
CREATE TABLE Registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    schedule_id INT NOT NULL,
    status ENUM('Enrolled', 'Waitlisted', 'Dropped') DEFAULT 'Enrolled',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Students(id),
    FOREIGN KEY (schedule_id) REFERENCES Schedules(id),
    UNIQUE(student_id, schedule_id) -- Prevent double registration
);

-- --- SEED DATA ---
INSERT INTO Departments (name, code) VALUES ('Computer Science', 'CS');
-- Password is 'password123' hashed using bcrypt
INSERT INTO Users (email, password_hash, role) VALUES ('student@anu.edu.eg', '$2b$10$wY...hashed...string', 'Student');
INSERT INTO Students (user_id, first_name, last_name, major_id) VALUES (1, 'Ahmed', 'Ali', 1);
INSERT INTO Courses (code, title, credits, department_id) VALUES ('CS-301', 'Software Engineering', 3, 1);
INSERT INTO Schedules (course_id, semester, days, start_time, end_time, capacity) VALUES (1, 'Fall 2026', 'Mon/Wed', '10:00:00', '11:30:00', 30);