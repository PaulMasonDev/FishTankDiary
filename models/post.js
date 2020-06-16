const mongoose = require("mongoose");

// POST SCHEMA
const postSchema = new mongoose.Schema({
    phLevel: String,
    nitrates: String,
    nitrites: String,
    ammonia: String,
    waterChanged: String,
    waterAmount: String,
    notes: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: ""
        }
    ],
    created: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Post", postSchema);