const app = require("./src/app.js");
const connectDB = require("./src/config/database.js");
const config = require("./src/config/config.js");

async function startServer() {
    try {
        await connectDB();
        const server = app.listen(config.PORT, "0.0.0.0", () => {
            console.log(`LexAi API listening on http://127.0.0.1:${config.PORT}`);
            console.log(`AI service: ${config.FASTAPI_URI}`);
        });

        const shutdown = () => {
            server.close(async () => {
                await connectDB.disconnectDB();
                process.exit(0);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        console.error("Failed to start LexAi API:", error);
        process.exitCode = 1;
    }
}

startServer();

