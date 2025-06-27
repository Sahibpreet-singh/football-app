function ensureAuth(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/auth/google");
  }
  
  module.exports = ensureAuth;
  