const express = require("express");
const router = express.Router();
const WrapAsync = require("../utility/WrapAsync.js");
const validate = require("../middlewares/validate.js");

const {
    conversationSchema,
    conversationUpdateSchema
} = require("../validations/conversation.validation.js");

const {
    createConversation,
    getConversations,
    getConversation,
    DeleteConversation,
    UpdateConversation
} = require("../controller/conversation.controller.js");

const Auth = require("../middlewares/auth.middleware.js");



router.post("/", Auth.Authenticated, validate(conversationSchema), WrapAsync(createConversation));

router.get("/", Auth.Authenticated, WrapAsync(getConversations));

router.get("/:id", Auth.Authenticated, WrapAsync(getConversation));

router.patch("/:id", Auth.Authenticated, Auth.AuthorizationConvo, validate(conversationUpdateSchema), WrapAsync(UpdateConversation));

router.delete("/:id", Auth.Authenticated, Auth.AuthorizationConvo, WrapAsync(DeleteConversation));

module.exports = router;
