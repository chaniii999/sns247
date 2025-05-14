import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/index.js';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 기존 사용자 확인
      let user = await User.findOne({
        where: {
          provider: 'google',
          providerId: profile.id
        }
      });

      if (!user) {
        // 새 사용자 생성
        user = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          profileImage: profile.photos[0].value,
          provider: 'google',
          providerId: profile.id
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

export default passport;
