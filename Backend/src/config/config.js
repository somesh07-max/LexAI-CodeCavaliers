const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required in production");
}

if (isProduction && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in production");
}

module.exports = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT || 3000),
    MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lexai",
    JWT_SECRET: process.env.JWT_SECRET || "lexai-local-development-secret-change-me",
    FASTAPI_URI: (process.env.FASTAPI_URI || "http://127.0.0.1:8000").replace(/\/$/, ""),
    AI_TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS || 90000),
    CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
};
