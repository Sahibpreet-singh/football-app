// middleware/isMainAdmin.js
module.exports = function (req, res, next) {
    const allowedEmail = "sahibpreetrai26@gmail.com"; // Replace with your admin email
    if (req.user && req.user.email === allowedEmail) {
      return next();
    }
    return res.status(403).send("Access denied. Only main admin can do this.");
  };
  