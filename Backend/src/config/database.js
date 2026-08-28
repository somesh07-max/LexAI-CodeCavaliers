const mongoose = require("mongoose");
const config = require("./config.js");

async function connectDB() {
  await mongoose.connect(config.MONGO_URI);
  console.log("MongoDB connection successful");
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
