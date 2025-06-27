// Update models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
  teamname: String,
  clan: { type: mongoose.Schema.Types.ObjectId, ref: "clan" },
  role: { type: String, default: "member" } 
});

module.exports = mongoose.model("User", userSchema);
