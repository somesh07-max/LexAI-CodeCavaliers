const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
const config = require("./config/config.js");
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
 
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || config.CORS_ORIGINS.includes(origin)) return callback(null, true);
            return callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        credentials: true
    })
);
 
 
const authRoutes = require("./routes/Authentication.routes.js");
const conversationRoutes = require("./routes/conversation.routes.js");
const messageRoutes = require("./routes/message.routes.js");
const quizRoutes = require("./routes/quiz.routes.js")
 
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/quiz",quizRoutes)

app.get("/api/health", async (req, res) => {
    let ai = { ok: false, status: "unreachable" };
    try {
        const response = await fetch(`${config.FASTAPI_URI}/health`, {
            signal: AbortSignal.timeout(3000)
        });
        if (response.ok) ai = { ok: true, ...(await response.json()) };
    } catch {
        // The API remains healthy even when its optional AI dependency is down.
    }

    res.status(200).json({
        success: true,
        status: "ok",
        database: "connected",
        ai
    });
});
 
 
 
 
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});
 
 
 
 
const errorHandler = require("./middlewares/error.middleware.js");
 
app.use(errorHandler);
 
 
module.exports = app;
