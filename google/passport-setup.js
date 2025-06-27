const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});


  
///////////////////////////////////////////////////
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: "273668627967-4aiq6nghskkdhgcdaqs3m10tb4goe635.apps.googleusercontent.com",
    clientSecret: "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", 
    callbackURL: '/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        teamname: null, // initially null
      });
    }
    done(null, user);
  }
));
