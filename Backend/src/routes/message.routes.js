const express = require("express");

const router = express.Router();

const WrapAsync = require("../utility/WrapAsync.js");

const validate = require("../middlewares/validate.js");

const {
    messageSchema
} = require("../validations/message.validation.js");

const {
    translateMessageSchema
} = require("../validations/translation.validation.js");

const {
    createMessage,
    getMessages,
    translateMessage
} = require("../controller/message.controller.js");

const Auth = require("../middlewares/auth.middleware.js");


router.post(
    "/:conversation_id",
    Auth.Authenticated,
    Auth.AuthorizationConvo,
    validate(messageSchema),
    WrapAsync(createMessage)
);


router.get(
    "/:conversation_id",
    Auth.Authenticated,
    Auth.AuthorizationConvo,
    WrapAsync(getMessages)
);


router.post(
    "/:message_id/translate",
    Auth.Authenticated,
    validate(translateMessageSchema),
    WrapAsync(translateMessage)
);


module.exports = router;
