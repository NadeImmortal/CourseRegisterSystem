const jwt = require('jsonwebtoken');

// Verify standard login token
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ error: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    jwt.verify(token, 'SUPER_SECRET_KEY', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized. Token expired or invalid.' });
        }
        
        req.user = decoded; // Attach user data (userId, role) to request
        next(); // Proceed to the actual controller
    });
};

// Role-based Access Control (RBAC)
exports.requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== requiredRole) {
            return res.status(403).json({ 
                error: `Forbidden. Requires ${requiredRole} privileges.` 
            });
        }
        next();
    };
};