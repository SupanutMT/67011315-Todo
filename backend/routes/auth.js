const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, fullName, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  // check if user exists
  const [existing] = await db.query(
    "SELECT id FROM users WHERE username = ?",
    [username]
  );

  if (existing.length > 0) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    `
    INSERT INTO users (username, full_name, password, auth_provider, profile_image)
    VALUES (?, ?, ?, 'local', '/default-avatar.png')
    `,
    [username, fullName || username, hashedPassword]
  );

  const token = jwt.sign(
    { id: result.insertId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: result.insertId,
      username,
      fullName: fullName || username,
      profile_image: "/default-avatar.png",
      auth_provider: "local",
    },
  });
});


router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await db.query(
    "SELECT * FROM users WHERE username = ? AND auth_provider = 'local'",
    [username]
  );

  if (rows.length === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = rows[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      profile_image: user.profile_image,
      auth_provider: "local",
    },
  });
});

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        profile_image: user.profile_image,
        auth_provider: user.auth_provider,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // redirect back to frontend
    res.redirect(
      `http://localhost:3000/oauth-success?token=${token}`
    );
  }
);

module.exports = router;
