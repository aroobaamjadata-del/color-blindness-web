const express = require("express");
const path = require("path");
const cors = require("cors");
const { config } = require("dotenv");
const mongoose = require("mongoose");

config();

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: true,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

if (process.env.MONGOURL) {
    mongoose.connect(process.env.MONGOURL, { dbName: "bgremover" })
        .then(() => {
            console.log("Connected to MongoDB");
        }).catch((err) => {
            console.log(err);
        });
} else {
    console.log("MONGOURL not set. Running without MongoDB.");
}

const authRouter = require("./routes/auth");
const imageRouter = require("./routes/image");

app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/image", imageRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
