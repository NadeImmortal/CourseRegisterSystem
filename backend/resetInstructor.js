const bcrypt = require('bcrypt');
const db = require('./config/db');

async function resetInstructor() {
    console.log("⏳ Fixing Instructor account...");
    const email = 'instructor@anu.edu.eg';
    const password = 'password123';

    try {
        // 1. Wipe the old, broken account (Cascades to delete from Instructors table too)
        await db.execute('DELETE FROM Users WHERE email = ?', [email]);
        
        // 2. Hash password natively
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create fresh User
        const [userResult] = await db.execute(
            'INSERT INTO Users (email, password_hash, role) VALUES (?, ?, "Instructor")',
            [email, hashedPassword]
        );
        const userId = userResult.insertId;

        // 4. Create fresh Instructor profile linked to that user
        await db.execute(
            'INSERT INTO Instructors (user_id, title) VALUES (?, "Dr. Alan")',
            [userId]
        );

        console.log("✅ SUCCESS! Instructor account fixed.");
        console.log("👉 Login: instructor@anu.edu.eg | Pass: password123\n");
    } catch (error) {
        console.error("🔥 Error:", error);
    } finally {
        process.exit();
    }
}

resetInstructor();