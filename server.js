
require('dotenv').config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");

const http = require("http");
const { Server } = require("socket.io");

const matchddb = require("./models/match");
const user = require("./models/User");
const Clan = require("./models/clan");

const ensureAuth = require("./middleware/auth");
const clanRoutes = require("./routes/clanRoutes");

require("./google/passport-setup");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ==== MongoDB Connection ====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ==== Middleware ====
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ==== Auth Routes ====
app.get("/", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.render("login", { user: null });
  }
  res.redirect("/index");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    if (!req.user.teamname) {
      return res.redirect("/set-teamname");
    }
    res.redirect("/");
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// ==== Index ====
app.get("/index", ensureAuth, (req, res) => {
  res.render("index", { user: req.user });
});

// ==== Teamname Setup ====
app.get("/set-teamname", ensureAuth, (req, res) => {
  res.render("set-teamname", { user: req.user });
});

app.post("/set-teamname", ensureAuth, async (req, res) => {
  req.user.teamname = req.body.teamname;
  await req.user.save();
  res.redirect("/");
});

// ==== Match Routes ====
app.get("/fix-match", ensureAuth, (req, res) => {
  res.render("fix-match");
});

// Inside the route to fetch matches
app.get("/match", ensureAuth, async (req, res) => {
  try {
    const matches = await matchddb.find().populate("clan");
    res.render("match", { matches, user: req.user });
  } catch (err) {
    console.error("Error fetching matches:", err);
    res.status(500).send("Error fetching matches");
  }
});



app.post("/match", ensureAuth, async (req, res) => {
  const { place, time, date } = req.body;
  const fullDate = new Date(`${date}T${time}`);

  const adminClan = await Clan.findOne({ admin: req.user._id });

  const newMatch = new matchddb({
    teamname: req.user.teamname,
    location: place,
    date: fullDate,
    clan: adminClan ? adminClan._id : null,
  });

  await newMatch.save();
  res.redirect("/match");
});


app.get("/match/:id", ensureAuth, async (req, res) => {
  const match = await matchddb.findById(req.params.id);
  if (!match) return res.send("Match not found");
  res.render("match-details", { match, user: req.user });
});

app.post("/join-match/:id", ensureAuth, async (req, res) => {
  try {
    const match = await matchddb.findById(req.params.id);
    if (!match) return res.status(404).send("Match not found");

    if (!match.joinedBy && match.teamname !== req.user.teamname) {
      match.joinedBy = req.user.teamname;
      await match.save();
    }

    res.redirect("/match");
  } catch (err) {
    console.error("Error joining match:", err);
    res.status(500).send("Something went wrong.");
  }
});

app.get("/match-data", ensureAuth, async (req, res) => {
  const matches = await matchddb.find();
  res.json(matches);
});

app.get("/match-details/:id", ensureAuth, async (req, res) => {
  const match = await matchddb.findById(req.params.id);
  if (!match) return res.status(404).send("Match not found");
  res.render("match-details", { match, user: req.user });
});

// ==== Match Routes ====
// Show match creation form - GET /matches/create
app.get("/create", ensureAuth, (req, res) => {
  res.render("fix-match", { user: req.user }); // Assuming you have a view named "create-match.ejs"
});

// ==== Clan Routes ====
app.use("/clans", clanRoutes);

// ==== Socket.IO for Clan Chat ====
io.on("connection", (socket) => {
  console.log("🟢 A user connected");

  socket.on("joinClanRoom", (clanId) => {
    socket.join(clanId);
    console.log(`👥 User joined clan room: ${clanId}`);
  });

  socket.on("chatMessage", ({ clanId, username, message }) => {
    io.to(clanId).emit("chatMessage", {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  });
  socket.on("disconnect", ()  => {
    console.log("🔴 User disconnected");
  });

  
});



// ==== Server Start ====

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

