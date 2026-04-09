const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authModel = require("../models/auth");
const verifyToken = require("../middleware/auth");

const generateRandomID = () => Math.random().toString(16).slice(3);

router.post("/signup", async (req, res) => {
    try {
        const newUserData = req.body;
        const { email, password } = newUserData;

        const userFound = await authModel.findOne({ email });
        if (userFound) {
            return res.status(403).json({ message: "User already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            ...newUserData,
            password: hashedPassword,
            userId: generateRandomID(),
            role: "user",
        };

        await authModel.create(newUser);
        return res.status(201).json({ message: "User created successfully!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await authModel.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "Invalid username!" });
        }

        const matchedPassword = await bcrypt.compare(password, user.password);

        if (matchedPassword) {
            const { userId } = user;
            const token = jwt.sign({ userId }, "secret-key", { expiresIn: "3d" });
            return res.status(200).json({ message: "User logged in successfully!", token, user });
        }

        return res.status(401).json({ message: "Invalid username or password!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});

router.get("/user", verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await authModel.findOne({ userId });

        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        return res.status(200).json({ message: "User found", user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;
