const mongoose = require("mongoose");
const { Schema } = mongoose;

const authSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
}, { timestamps: true });

const authModel = mongoose.models.auth || mongoose.model("auth", authSchema);
module.exports = authModel;
