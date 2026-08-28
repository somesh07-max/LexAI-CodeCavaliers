const mongoose = require("mongoose");


const questionSchema = new mongoose.Schema({

    questionText: {
        type: String,
        required: true
    },

    options: {
        type: [String],
        required: true
    },

    correctAnswer: {
        type: String,
        required: true
    },

    explanation: {
        type: String
    }

});




const quizSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        subject: {
            type: String,
            required: true
        },

        topic: {
            type: String,
            required: true
        },

        language: {
            type: String,
            required: true
        },

        numberOfQuestions: {
            type: Number,
            required: true
        },

        questions: {
            type: [questionSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);


module.exports = mongoose.model("Quiz", quizSchema);
