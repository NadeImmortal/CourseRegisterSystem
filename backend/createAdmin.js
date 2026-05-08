const bcrypt = require('bcrypt');
const db = require('./config/db');

async function setupAdmin() {
    console.log("⏳ Setting up Admin account...");
    const email = 'admin@anu.edu.eg';
    const password = 'password123';

    try {
        // Hash the password using YOUR machine's bcrypt library
        const hashedPassword = await bcrypt.hash(password, 10);

        // Try to insert the new admin
        await db.execute(
            'INSERT INTO Users (email, password_hash, role) VALUES (?, ?, "Admin")',
            [email, hashedPassword]
        );
        console.log(`✅ Success! Admin created. \nEmail: ${email} \nPassword: ${password}`);

    } catch (error) {
        // If the email is already in the database from the previous SQL attempt, 
        // we will safely overwrite the broken password hash with a working one.
        if (error.code === 'ER_DUP_ENTRY') {
            console.log("⚠️ Admin email already exists. Updating password to fix the hash...");
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.execute(
                'UPDATE Users SET password_hash = ? WHERE email = ?', 
                [hashedPassword, email]
            );
            console.log("✅ Success! Admin password fixed to 'password123'.");
        } else {
            console.error("🔥 Database Error:", error);
        }
    } finally {
        process.exit(); // Close the script
    }
}

setupAdmin();