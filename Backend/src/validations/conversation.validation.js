const Joi = require("joi");

const conversationSchema = Joi.object({
    title: Joi.string().trim().min(1).max(120).required(),
    subject: Joi.string().trim().min(1).max(120).required(),
    language: Joi.string().trim().min(2).max(40).required()
});

const conversationUpdateSchema = Joi.object({
    title: Joi.string().trim().min(1).max(120),
    subject: Joi.string().trim().min(1).max(120),
    language: Joi.string().trim().min(2).max(40)
}).min(1);

module.exports = {
    conversationSchema,
    conversationUpdateSchema
};
