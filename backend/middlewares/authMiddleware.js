const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(" ")[1];
    if (!token) return res.status(401).send({ error: 'Access denied, no token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log("user",req.user);
        next();
    } catch (error) {
        res.status(400).send({ error: 'Invalid token' });
    }

};

const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        if (req.user.userType !== requiredRole) {
            return res.status(403).send({ error: 'Access denied, insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };

