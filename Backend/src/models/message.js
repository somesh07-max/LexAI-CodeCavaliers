const mongoose = require("mongoose");
 
const messageSchema = new mongoose.Schema(
    {
        conversation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
 
        sender: {
            type: String,
            enum: ["student", "ai"],
            required: true
        },
 
        content: {
            type: String,
            required: true
        },
 
        translations: [
            {
                language: {
                    type: String,
                    required: true
                },
 
                content: {
                    type: String,
                    required: true
                }
            }
        ]
    },
    {
        timestamps: true
    }
);
 
module.exports = mongoose.model("Message", messageSchema);
