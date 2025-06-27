const mongoose = require("mongoose");

const clanSchema = new mongoose.Schema({
  name: String,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [
    {
      sender: String, // or mongoose.Schema.Types.ObjectId if you want to reference users
      content: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
});
module.exports = mongoose.model("Clan", clanSchema);