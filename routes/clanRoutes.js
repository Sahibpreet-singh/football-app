const express = require("express");
const router = express.Router();
const Clan = require("../models/clan");
const isMainAdmin = require("../middleware/isadmin");
const ensureAuth = require("../middleware/auth");
const mongoose=require("mongoose");
// GET /clans - List all clans
router.get("/", ensureAuth, async (req, res) => {
  try {
    const clans = await Clan.find().populate("admin", "displayName");
    res.render("clans/clan-list", { clans, user: req.user });
  } catch (err) {
    console.error("Error fetching clans:", err);
    res.status(500).send("Error fetching clans");
  }
});

// Show clan creation form - GET /clans/create
router.get("/create", ensureAuth, isMainAdmin, (req, res) => {
  res.render("clans/create", { user: req.user });
});

// Handle clan creation - POST /clans
router.post("/", ensureAuth, isMainAdmin, async (req, res) => {
  const { name } = req.body;

  try {
    const newClan = new Clan({
      name,
      admin: req.user._id,
      members: [req.user._id], // main admin is also first member
    });

    await newClan.save();
    res.redirect("/clans");
  } catch (err) {
    console.error("Clan creation error:", err);
    res.status(500).send("Something went wrong.");
  }
});

// Request to join a clan - POST /clans/:id/join
router.post("/:id/join", ensureAuth, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).send("Clan not found");

    const alreadyMember = clan.members.includes(req.user._id);
    const alreadyRequested = clan.joinRequests.includes(req.user._id);

    if (!alreadyMember && !alreadyRequested) {
      clan.joinRequests.push(req.user._id);
      await clan.save();
    }

    res.redirect(`/clans/${clan._id}`);
  } catch (err) {
    console.error("alredy a member or reqested joining clan:", err);
    res.status(500).send("Error joining clan");
  }
});

// Show individual clan page - GET /clans/:id
router.get("/:id", ensureAuth, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id).populate("admin").populate("members");
    
    // Ensure messages is an array
    if (!clan.messages) {
      clan.messages = []; // Initialize as empty array if undefined
    }

    res.render("clans/clan", { clan, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading clan");
  }
});


// Approve join request - POST /clans/approve/:clanId/:userId
router.post("/approve/:clanId/:userId", ensureAuth, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.clanId);
    if (!clan.admin.equals(req.user._id)) {
      return res.status(403).send("Forbidden");
    }

    const userId = req.params.userId;
    clan.joinRequests.pull(userId);
    clan.members.push(userId);

    await clan.save();
    res.redirect(`/clans/${clan._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Handle chat messages - POST /clans/:id/chat
router.post("/:id/chat", ensureAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const clan = await Clan.findById(req.params.id);

    if (!clan) return res.status(404).send("Clan not found");

    // Save the message
    clan.messages.push({
      sender: req.user.displayName,
      content: message,
      timestamp: new Date(),
    });

    await clan.save();
    res.redirect(`/clans/${clan._id}`);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).send("Error saving message");
  }
});



// Exit Clan Route - POST /clans/exit/:clanId
router.post("/exit/:clanId", ensureAuth, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.clanId);

    if (!clan) return res.status(404).send("Clan not found");

    // Prevent the admin from leaving the clan
    if (clan.admin.equals(req.user._id)) {
      return res.status(400).send("Admin can't leave the clan. Transfer ownership first.");
    }

    // Check if the user is actually a member of the clan
    if (!clan.members.includes(req.user._id)) {
      return res.status(400).send("You are not a member of this clan.");
    }

    // Remove user from the members list
    clan.members.pull(req.user._id);
    await clan.save();

    res.redirect("/clans");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
