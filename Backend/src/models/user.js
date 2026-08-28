const mongoose = require("mongoose");
const Schema = mongoose.Schema;
 
const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        college: {
            type: String,
            required: true
        },
        branch: {
            type: String,
            required: true
        },
        semester: {
            type: Number,
            enum: [1, 2, 3, 4, 5, 6, 7, 8]
        },
        year: {
            type: Number,
            required: true
        },
        preferredLanguage: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);
 
module.exports = mongoose.model("User", userSchema);
