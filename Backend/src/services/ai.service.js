const config = require("../config/config.js");
const AppError = require("../utility/AppError.js");

async function callAI(path, payload) {
    let response;
    try {
        response = await fetch(`${config.FASTAPI_URI}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(config.AI_TIMEOUT_MS)
        });
    } catch (error) {
        if (error.name === "TimeoutError") {
            throw new AppError("AI service timed out. Please try again.", 504);
        }
        throw new AppError("AI service is unavailable. Start it and try again.", 503);
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new AppError("AI service returned an invalid response", 502);
    }

    if (!response.ok) {
        const detail = typeof data.detail === "string" ? data.detail : data.message;
        throw new AppError(detail || "AI service failed", 502);
    }

    return data;
}

module.exports = { callAI };
