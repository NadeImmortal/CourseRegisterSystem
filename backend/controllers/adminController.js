const bcrypt = require('bcrypt');
const db = require('../config/db');

// 1. Get all courses with schedule and instructor details
exports.getAdminCourses = async (req, res) => {
    try {
        const query = `
            SELECT c.id as course_id, c.code, c.title, c.credits, 
                   s.id as schedule_id, s.capacity, s.enrolled_count, 
                   i.id as instructor_id, u.email as instructor_email
            FROM Courses c
            LEFT JOIN Schedules s ON c.id = s.course_id
            LEFT JOIN Instructors i ON s.instructor_id = i.id
            LEFT JOIN Users u ON i.user_id = u.id
        `;
        const [courses] = await db.execute(query);
        res.json(courses);
    } catch (error) {
        console.error("Admin Fetch Courses Error:", error);
        res.status(500).json({ error: 'Failed to fetch courses.' });
    }
};

// 2. Add a new course and its schedule
exports.addCourse = async (req, res) => {
    const { code, title, credits, semester, days, start_time, end_time, capacity } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Insert Course (Assuming department_id = 1 for now to keep it simple)
        const [courseResult] = await connection.execute(
            'INSERT INTO Courses (code, title, credits, department_id) VALUES (?, ?, ?, 1)',
            [code, title, credits]
        );
        const courseId = courseResult.insertId;

        // Insert Schedule
        await connection.execute(
            'INSERT INTO Schedules (course_id, semester, days, start_time, end_time, capacity) VALUES (?, ?, ?, ?, ?, ?)',
            [courseId, semester, days, start_time, end_time, capacity]
        );

        await connection.commit();
        res.status(201).json({ message: 'Course added successfully!' });
    } catch (error) {
        await connection.rollback();
        console.error("Add Course Error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Course code already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to add course.' });
        }
    } finally {
        connection.release();
    }
};

// 3. Delete a course
exports.deleteCourse = async (req, res) => {
    const { course_id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        
        // Delete Schedules first (Foreign Key constraint)
        await connection.execute('DELETE FROM Schedules WHERE course_id = ?', [course_id]);
        // Delete the Course
        await connection.execute('DELETE FROM Courses WHERE id = ?', [course_id]);

        await connection.commit();
        res.json({ message: 'Course deleted successfully!' });
    } catch (error) {
        await connection.rollback();
        console.error("Delete Course Error:", error);
        res.status(500).json({ error: 'Cannot delete course. Students might be enrolled.' });
    } finally {
        connection.release();
    }
};

// 4. Oversee all student enrollments
exports.getAllEnrollments = async (req, res) => {
    try {
        const query = `
            SELECT r.id, st.first_name, st.last_name, u.email, c.code as course_code, r.status, r.registration_date
            FROM Registrations r
            JOIN Students st ON r.student_id = st.id
            JOIN Users u ON st.user_id = u.id
            JOIN Schedules s ON r.schedule_id = s.id
            JOIN Courses c ON s.course_id = c.id
            ORDER BY r.registration_date DESC
        `;
        const [enrollments] = await db.execute(query);
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch enrollments.' });
    }
};

// 5. Get a list of all instructors for the dropdown menu
exports.getAllInstructors = async (req, res) => {
    try {
        const query = `
            SELECT i.id as instructor_id, i.title, u.email, u.id as user_id
            FROM Instructors i
            JOIN Users u ON i.user_id = u.id
        `;
        const [instructors] = await db.execute(query);
        res.json(instructors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch instructors.' });
    }
};

// 6. Assign an instructor to a specific schedule
exports.assignInstructor = async (req, res) => {
    const { schedule_id } = req.params;
    const { instructor_id } = req.body;

    try {
        await db.execute(
            'UPDATE Schedules SET instructor_id = ? WHERE id = ?',
            [instructor_id, schedule_id]
        );
        res.json({ message: 'Instructor assigned successfully!' });
    } catch (error) {
        console.error("Assign Instructor Error:", error);
        res.status(500).json({ error: 'Failed to assign instructor.' });
    }
};
// 7. Add a new Instructor
exports.addInstructor = async (req, res) => {
    const { title, email, password } = req.body;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insert into Users table as an 'Instructor'
        const [userResult] = await connection.execute(
            'INSERT INTO Users (email, password_hash, role) VALUES (?, ?, "Instructor")',
            [email, hashedPassword]
        );
        const userId = userResult.insertId;

        // 3. Insert into Instructors table
        await connection.execute(
            'INSERT INTO Instructors (user_id, title) VALUES (?, ?)',
            [userId, title]
        );

        await connection.commit();
        res.status(201).json({ message: 'Instructor account created successfully!' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Add Instructor Error:", error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'An account with this email already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to create instructor account.' });
        }
    } finally {
        if (connection) connection.release();
    }
};