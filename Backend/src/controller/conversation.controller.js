const Conversation = require("../models/conversation.js");
const Message = require("../models/message.js");
const AppError = require("../utility/AppError.js");




async function createConversation(req, res) {

    const { title, subject, language } = req.body;

    const user_id = req.user.id;

    const conversation = await Conversation.create({
        user_id,
        title,
        subject,
        language
    });

    res.status(201).json({
        success: true,
        message: "New conversation created",
        conversation
    });
}




async function getConversations(req, res) {

    const user_id = req.user.id;

    const All = await Conversation.find({
        user_id
    }).sort({ updatedAt: -1 });

    res.status(200).json({
        success: true,
        conversations: All
    });
}




async function getConversation(req, res) {

    const { id } = req.params;
    const user_id = req.user.id;

    const oneConversation = await Conversation.findOne({
        _id: id,
        user_id
    });

    if (!oneConversation) {
        throw new AppError("Conversation not found", 404);
    }

    res.status(200).json({
        success: true,
        conversation: oneConversation
    });
}



async function DeleteConversation(req, res) {

    const { id } = req.params;
    const user_id = req.user.id;

    const oneConvo = await Conversation.findOneAndDelete({
        _id: id,
        user_id
    });

    if (!oneConvo) {
        throw new AppError("Conversation not found", 404);
    }

    await Message.deleteMany({ conversation_id: id });

    res.status(200).json({
        success: true,
        message: "Conversation successfully deleted"
    });
}




async function UpdateConversation(req, res) {

    const { id } = req.params;
    const user_id = req.user.id;

    const convo = await Conversation.findOneAndUpdate(
        {
            _id: id,
            user_id
        },
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (!convo) {
        throw new AppError("Conversation not found", 404);
    }

    res.status(200).json({
        success: true,
        message: "Conversation successfully updated",
        conversation: convo
    });
}


module.exports = {
    createConversation,
    getConversations,
    getConversation,
    DeleteConversation,
    UpdateConversation
};
