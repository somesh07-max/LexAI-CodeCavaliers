const Message = require("../models/message.js");
const Conversation = require("../models/conversation.js");
const AppError = require("../utility/AppError.js");
const { callAI } = require("../services/ai.service.js");



async function createMessage(req, res) {

    const { conversation_id } = req.params;
    const { content } = req.body;

    const user_id = req.user.id;

    const conversation = await Conversation.findOne({
        _id: conversation_id,
        user_id
    });

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    const data = await callAI("/generate", { conversation_id, message: content });

    const [studentMessage, aiMessage] = await Message.create([
        { conversation_id, sender: "student", content },
        { conversation_id, sender: "ai", content: data.response, translations: [] }
    ]);

    res.status(201).json({
        success: true,
        studentMessage,
        aiMessage
    });
}

async function getMessages(req, res) {

    const { conversation_id } = req.params;

    const user_id = req.user.id;

    const conversation = await Conversation.findOne({
        _id: conversation_id,
        user_id
    });

    if (!conversation) {

        throw new AppError(
            "Conversation not found",
            404
        );

    }

    const messages = await Message.find({
        conversation_id
    }).sort({
        createdAt: 1
    });

    res.status(200).json({

        success: true,

        messages

    });
}




async function translateMessage(req, res) {

    const { message_id } = req.params;
    const { language } = req.body;

    const user_id = req.user.id;


    
    const message = await Message.findOne({
        _id: message_id,
        sender: "ai"
    });

    if (!message) {
        throw new AppError("AI message not found", 404);
    }


    
    const conversation = await Conversation.findOne({
        _id: message.conversation_id,
        user_id
    });

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }


    
    const existingTranslation = message.translations.find(
        (translation) =>
            translation.language === language
    );


    
    if (existingTranslation) {

        return res.status(200).json({
            success: true,
            message_id,
            language,
            translated: existingTranslation.content
        });
    }


   
    const data = await callAI("/translate", {
        text: message.content,
        target_language: language
    });


    
    message.translations.push({
        language,
        content: data.response
    });


    await message.save();


   
    res.status(200).json({
        success: true,
        message_id,
        language,
        translated: data.response
    });
}


module.exports = {

    createMessage,

    getMessages,

    translateMessage

};
