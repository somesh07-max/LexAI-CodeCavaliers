const mongoose = require("mongoose");
const config = require("./config.js");

let memoryServer;

async function connectDB() {
  let uri = config.MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create({ instance: { dbName: "lexai" } });
    uri = memoryServer.getUri();
    console.warn("MONGO_URI is not set; using an in-memory development database.");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connection successful");
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
