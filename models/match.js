const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  teamname: String, // who created it
  location: String,
  date: Date,
  joinedBy: String,
  clan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clan", // this should match the model name for clans
  },
});

module.exports = mongoose.model("Match", matchSchema);
