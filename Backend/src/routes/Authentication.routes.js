const express = require("express");
const controllers = require("../controller/auth.controller.js");
const WrapAsync = require("../utility/WrapAsync.js");
const validate = require("../middlewares/validate.js");

const router = express.Router();

const {
    signupSchema,
    loginSchema
} = require("../validations/auth.validation.js");


router.post("/signup", validate(signupSchema), WrapAsync(controllers.signUp));
router.post("/login", validate(loginSchema), WrapAsync(controllers.login));
router.post("/refresh-token", WrapAsync(controllers.refreshToken));
router.post("/logout", WrapAsync(controllers.logout));

module.exports = router;
