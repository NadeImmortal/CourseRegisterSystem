const db = require('../config/db');

// 1. Get courses assigned to the logged-in instructor
exports.getAssignedCourses = async (req, res) => {
    const userId = req.user.userId; 

    try {
        const query = `
            SELECT s.id as schedule_id, c.code, c.title, c.credits, 
                   s.semester, s.days, s.start_time, s.end_time, 
                   s.capacity, s.enrolled_count
            FROM Schedules s
            JOIN Courses c ON s.course_id = c.id
            JOIN Instructors i ON s.instructor_id = i.id
            WHERE i.user_id = ?
        `;
        const [courses] = await db.execute(query, [userId]);
        res.json(courses);
    } catch (error) {
        console.error("Instructor Courses Error:", error);
        res.status(500).json({ error: 'Failed to fetch assigned courses.' });
    }
};

// 2. Get the student roster for a specific schedule
exports.getCourseRoster = async (req, res) => {
    const { schedule_id } = req.params;
    const userId = req.user.userId;

    try {
        // First, verify this instructor actually owns this schedule (Security Check!)
        const [authCheck] = await db.execute(`
            SELECT s.id FROM Schedules s 
            JOIN Instructors i ON s.instructor_id = i.id 
            WHERE s.id = ? AND i.user_id = ?
        `, [schedule_id, userId]);

        if (authCheck.length === 0) {
            return res.status(403).json({ error: 'Unauthorized to view this roster.' });
        }

        // Fetch the enrolled students
        const query = `
            SELECT st.first_name, st.last_name, u.email, r.registration_date
            FROM Registrations r
            JOIN Students st ON r.student_id = st.id
            JOIN Users u ON st.user_id = u.id
            WHERE r.schedule_id = ? AND r.status = 'Enrolled'
        `;
        const [students] = await db.execute(query, [schedule_id]);
        res.json(students);
    } catch (error) {
        console.error("Roster Error:", error);
        res.status(500).json({ error: 'Failed to fetch class roster.' });
    }
};