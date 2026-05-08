const mysql = require('mysql2/promise');

// Create a connection pool for scalability and performance
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'university_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;