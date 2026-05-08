const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find User
        const [users] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];

        // 2. Verify Password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        // 3. Generate JWT Token
        const token = jwt.sign(
            { userId: user.id, role: user.role }, 
            'SUPER_SECRET_KEY', 
            { expiresIn: '2h' }
        );

        res.json({ message: 'Login successful', token, role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Function to register a new student
// Function to register a new student
exports.signup = async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    let connection; // Declare variable here so 'finally' can access it

    try {
        // Moved INSIDE the try block to prevent server crashes
        connection = await db.getConnection(); 
        await connection.beginTransaction();

        // 1. Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insert into Users table
        const [userResult] = await connection.execute(
            'INSERT INTO Users (email, password_hash, role) VALUES (?, ?, "Student")',
            [email, hashedPassword]
        );
        const userId = userResult.insertId;

        // 3. Insert into Students table
        await connection.execute(
            'INSERT INTO Students (user_id, first_name, last_name, major_id) VALUES (?, ?, ?, 1)',
            [userId, first_name, last_name]
        );

        await connection.commit();
        res.status(201).json({ message: 'Account created successfully!' });

    } catch (error) {
        if (connection) await connection.rollback();
        
        // THIS WILL PRINT THE EXACT ERROR IN YOUR TERMINAL!
        console.error("🔥 SIGNUP ERROR:", error); 

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Email already exists.' });
        } else {
            res.status(500).json({ error: 'Server error during registration.' });
        }
    } finally {
        if (connection) connection.release();
    }
};