const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        language: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Conversation", conversationSchema);
