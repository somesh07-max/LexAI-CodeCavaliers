const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
 
 app.use(
    cors({
        origin: "http://localhost:5173",
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
 
 
 
 
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});
 
 
 
 
const errorHandler = require("./middlewares/error.middleware.js");
 
app.use(errorHandler);
 
 
module.exports = app;