const db = require('../config/db');

// Fetch all available courses
exports.getAllCourses = async (req, res) => {
    try {
        // Updated query to pull the Instructor's title and email using a LEFT JOIN
        const query = `
            SELECT c.code, c.title, c.credits, s.id as schedule_id, s.days, s.start_time, s.capacity, s.enrolled_count,
                   i.title as instructor_name, u.email as instructor_email
            FROM Courses c 
            JOIN Schedules s ON c.id = s.course_id
            LEFT JOIN Instructors i ON s.instructor_id = i.id
            LEFT JOIN Users u ON i.user_id = u.id
        `;
        const [courses] = await db.execute(query);
        res.json(courses);
    } catch (error) {
        console.error("Fetch Courses Error:", error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

// FIX: Secure Registration using Token Data
exports.registerCourse = async (req, res) => {
    const { schedule_id } = req.body;
    const userId = req.user.userId; // Securely pulled from token via authMiddleware

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get the actual Student ID from the User ID
        const [student] = await connection.execute('SELECT id FROM Students WHERE user_id = ?', [userId]);
        if (student.length === 0) throw new Error('Student profile not found');
        const realStudentId = student[0].id;

        // 2. Check Capacity
        const [schedule] = await connection.execute(
            'SELECT capacity, enrolled_count FROM Schedules WHERE id = ? FOR UPDATE', [schedule_id]
        );
        if (schedule[0].enrolled_count >= schedule[0].capacity) {
            await connection.rollback();
            return res.status(400).json({ error: 'Class is full' });
        }

        // 3. Insert Registration
        await connection.execute(
            'INSERT INTO Registrations (student_id, schedule_id) VALUES (?, ?)',
            [realStudentId, schedule_id]
        );

        // 4. Update Enrolled Count
        await connection.execute(
            'UPDATE Schedules SET enrolled_count = enrolled_count + 1 WHERE id = ?',
            [schedule_id]
        );

        await connection.commit();
        res.status(201).json({ message: 'Successfully registered for course!' });

    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') res.status(400).json({ error: 'You are already registered for this course.' });
        else res.status(500).json({ error: 'Registration failed.' });
    } finally {
        connection.release();
    }
};

// NEW: Get Student's Enrolled Courses
exports.getMyCourses = async (req, res) => {
    const userId = req.user.userId;
    try {
        const query = `
            SELECT r.id as registration_id, c.code, c.title, s.days, s.start_time, r.status 
            FROM Registrations r
            JOIN Schedules s ON r.schedule_id = s.id
            JOIN Courses c ON s.course_id = c.id
            JOIN Students st ON r.student_id = st.id
            WHERE st.user_id = ?
        `;
        const [myCourses] = await db.execute(query, [userId]);
        res.json(myCourses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch your courses' });
    }
};

// NEW: Drop a Course
exports.dropCourse = async (req, res) => {
    const { registration_id } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Find the schedule ID before deleting
        const [reg] = await connection.execute('SELECT schedule_id FROM Registrations WHERE id = ?', [registration_id]);
        if (reg.length === 0) throw new Error('Registration not found');
        const scheduleId = reg[0].schedule_id;

        // Delete registration and decrement count
        await connection.execute('DELETE FROM Registrations WHERE id = ?', [registration_id]);
        await connection.execute('UPDATE Schedules SET enrolled_count = enrolled_count - 1 WHERE id = ?', [scheduleId]);

        await connection.commit();
        res.json({ message: 'Course dropped successfully.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to drop course.' });
    } finally {
        connection.release();
    }
};