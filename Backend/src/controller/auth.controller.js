const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const bcrypt = require("bcrypt");
const config = require("../config/config.js");
const AppError = require("../utility/AppError.js");

function refreshCookieOptions() {
    const production = config.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: production,
        sameSite: production ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

function safeUser(user) {
    const value = user.toObject();
    delete value.password;
    return value;
}



async function signUp(req, res) {

    const {
        name,
        email,
        college,
        year,
        branch,
        semester,
        preferredLanguage,
        password
    } = req.body;


    if (
        !name ||
        !email ||
        !college ||
        !year ||
        !branch ||
        !semester ||
        !preferredLanguage ||
        !password
    ) {
        throw new AppError("All fields are required", 400);
    }


    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        throw new AppError(
            "User with this email already exists",
            409
        );
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        college,
        year,
        branch,
        semester,
        preferredLanguage
    });


    const accessToken = jwt.sign(
        {
            id: newUser._id
        },
        config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    );


    const refreshToken = jwt.sign(
        {
            id: newUser._id
        },
        config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );


    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    const userToReturn = safeUser(newUser);

    res.status(201).json({
        success: true,
        message: "User saved successfully",
        accessToken,
        newUser: userToReturn
    });
}




async function login(req, res) {

    const { email, password } = req.body;


    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
        throw new AppError("User not found", 404);
    }


    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
    );


    if (!isPasswordCorrect) {
        throw new AppError("Wrong password", 401);
    }


    const accessToken = jwt.sign(
        {
            id: user._id
        },
        config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    );


    const refreshToken = jwt.sign(
        {
            id: user._id
        },
        config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );


    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    const userToReturn = safeUser(user);

    res.status(200).json({
        success: true,
        message: "Login successful",
        accessToken,
        user: userToReturn
    });
}




async function refreshToken(req, res) {

    const token = req.cookies.refreshToken;


    if (!token) {
        throw new AppError("Refresh token not found", 401);
    }


    const decoded = jwt.verify(
        token,
        config.JWT_SECRET
    );


    if (!decoded) {
        throw new AppError("Invalid refresh token", 401);
    }


    const id = decoded.id;
    const user = await User.findById(id);

    if (!user) {
        throw new AppError("User not found", 401);
    }


    const accessToken = jwt.sign(
        {
            id
        },
        config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    );


    const newRefreshToken = jwt.sign(
        {
            id
        },
        config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );


    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions());


    res.status(200).json({
        success: true,
        accessToken,
        user: safeUser(user)
    });
}

async function logout(req, res) {
    const production = config.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: production,
        sameSite: production ? "none" : "lax"
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
}


module.exports = {
    signUp,
    login,
    refreshToken,
    logout
};
