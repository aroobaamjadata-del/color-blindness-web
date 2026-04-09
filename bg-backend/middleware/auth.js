const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const parts = authHeader.split(" ");
    const token = parts.length === 2 ? parts[1] : null;

    if (!token) {
        return res.status(401).json({ message: "Token missing!" });
    }

    jwt.verify(token, "secret-key", (err, result) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token!" });
        }
        req.userId = result.userId;
        next();
    });
};

module.exports = verifyToken;
