const jwt = require("jsonwebtoken");
const Conversation = require("../models/conversation.js");
const config = require("../config/config.js");
const mongoose = require("mongoose");



async function Authenticated(req, res, next) {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization header missing"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}

async function AuthorizationConvo(req, res, next) {
    try {
        const userId = req.user.id;

        // Different routes name this param differently
        // (":id" for conversation routes, ":conversation_id" for message routes)
        const id = req.params.id || req.params.conversation_id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID"
            });
        }

        const convo = await Conversation.findById(id);

        if (!convo) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        if (userId.toString() !== convo.user_id.toString()) {
            return res.status(403).json({
                success: false,
                message: "User is not authorized"
            });
        }

        req.conversation = convo;

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}


module.exports = {
    Authenticated,
    AuthorizationConvo
};
