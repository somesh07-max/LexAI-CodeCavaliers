const Joi = require("joi");

const signupSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().trim().lowercase().email().required(),
    college: Joi.string().required(),
    year: Joi.number().required(),
    branch: Joi.string().required(),
    semester: Joi.number().required(),
    preferredLanguage: Joi.string().required(),
    password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required()
});

module.exports = {
    signupSchema,
    loginSchema
};
