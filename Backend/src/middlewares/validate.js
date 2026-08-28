const AppError = require("../utility/AppError.js");

function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        req.body = value;
        next();
    };
}

module.exports = validate;
