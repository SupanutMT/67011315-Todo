// backend/config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { getDb } = require("../db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback", // ✅ KEEP THIS
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const db = getDb();

        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const fullName = profile.displayName;
        const googlePhoto = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error("Google account has no email"));
        }

        // 🔍 Find user by google_id
        const [rows] = await db.query(
          "SELECT id, username, full_name, profile_image FROM users WHERE google_id = ?",
          [googleId]
        );

        let user;

        if (rows.length === 0) {
          // ➕ Create new Google user
          const [result] = await db.query(
            `
            INSERT INTO users (username, full_name, google_id, profile_image, auth_provider)
            VALUES (?, ?, ?, ?, 'google')
            `,
            [email, fullName, googleId, googlePhoto]
          );

          user = {
            id: result.insertId,
            username: email,
            full_name: fullName,
            profile_image: googlePhoto,
          };
        } else {
          user = rows[0];

          // 🔄 Sync Google profile image (optional but good)
          if (googlePhoto && user.profile_image !== googlePhoto) {
            await db.query(
              "UPDATE users SET profile_image = ?, full_name = ? WHERE id = ?",
              [googlePhoto, fullName, user.id]
            );
          }
        }

        return done(null, user);
      } catch (err) {
        console.error("❌ Google OAuth error:", err);
        return done(err, null);
      }
    }
  )
);

// ✅ REQUIRED (you already had this right)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = getDb();
    const [rows] = await db.query(
      "SELECT id, username, full_name, profile_image FROM users WHERE id = ?",
      [id]
    );
    done(null, rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
