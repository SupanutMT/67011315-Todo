// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const axios = require("axios");
const passport = require("passport");

require("./config/passport");

const { getDb } = require("./db");

const app = express();
const port = 5001;

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

// OAuth routes
app.use("/api/auth", require("./routes/auth"));

// Team routes
app.use("/api/teams", require("./routes/teams"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/users", async (req, res) => {
  const db = getDb();
  const [rows] = await db.query(
    "SELECT id, full_name, username FROM users"
  );
  res.json(rows);
});
// --------------------
// REGISTER
// --------------------
app.post("/api/register", async (req, res) => {
  const { full_name, username, password } = req.body;

  if (!full_name || !username || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const db = getDb();
    const password_hash = await bcrypt.hash(password, 10);

    const defaultAvatar = "/default-avatar.png";

    const [result] = await db.query(
      `
      INSERT INTO users (
        full_name,
        username,
        password_hash,
        profile_image,
        auth_provider
      )
      VALUES (?, ?, ?, ?, 'local')
      `,
      [full_name, username, password_hash, defaultAvatar]
    );

    res.status(201).json({
      id: result.insertId,
      full_name,
      username,
      profile_image: defaultAvatar,
      auth_provider: "local",
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists" });
    }
    console.error(err);
    res.status(500).json(err);
  }
});

// --------------------
// LOGIN (Username + CAPTCHA)
// --------------------
app.post("/api/login", async (req, res) => {
  const { username, password, captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ message: "CAPTCHA required" });
  }

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    // CAPTCHA verify
    const captchaRes = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET,
          response: captchaToken,
        },
      }
    );

    if (!captchaRes.data.success) {
      return res.status(403).json({ message: "CAPTCHA verification failed" });
    }

    const db = getDb();

    const [users] = await db.query(
      "SELECT id, username, password_hash, full_name FROM users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// --------------------
// TODOS
// --------------------
app.get("/api/todos/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const db = getDb();
    const [rows] = await db.query(
      `
      SELECT DISTINCT t.id, t.task, t.status, t.target_at, t.updated,
                      t.team_id, t.user_id, t.created_by
      FROM todo t
      LEFT JOIN team_members tm ON t.team_id = tm.team_id
      WHERE
        (t.team_id IS NULL AND t.user_id = ?)
        OR
        (t.team_id IS NOT NULL AND (tm.user_id = ? OR t.user_id = ?))
      ORDER BY t.status ASC, t.target_at ASC
      `,
      [userId, userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch todos" });
  }
});

app.get("/api/teams/:teamId/todos", async (req, res) => {
  const { teamId } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "user_id required" });
  }

  try {
    const db = getDb();

    const [rows] = await db.query(
      `
      SELECT t.*
      FROM todo t
      JOIN team_members tm
        ON t.team_id = tm.team_id
      WHERE t.team_id = ?
        AND tm.user_id = ?
      ORDER BY t.status ASC, t.target_at ASC
      `,
      [teamId, user_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch team todos" });
  }
});



app.post("/api/todos", async (req, res) => {
  const {
    user_id,
    task,
    target_at,
    team_id,
    created_by
  } = req.body;

  if (!user_id || !task || !created_by) {
    return res.status(400).json({
      message: "user_id, task, and created_by are required"
    });
  }

  try {
    const db = getDb();

    const [result] = await db.query(
      `
      INSERT INTO todo (
        user_id,
        task,
        target_at,
        status,
        team_id,
        created_by
      )
      VALUES (?, ?, ?, 0, ?, ?)
      `,
      [
        user_id,
        task,
        target_at || null,
        team_id || null,
        created_by
      ]
    );

    res.status(201).json({
      id: result.insertId,
      user_id,
      task,
      status: 0,
      target_at,
      team_id: team_id || null,
      created_by,
      updated: new Date(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create todo" });
  }
});



app.put("/api/todos/:id", async (req, res) => {
  const { status, target_at } = req.body;
  const fields = [];
  const values = [];

  if (status !== undefined) {
    fields.push("status = ?");
    values.push(status);
  }

  if (target_at !== undefined) {
    fields.push("target_at = ?");
    values.push(target_at);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  try {
    const db = getDb();
    const [result] = await db.query(
      `
      UPDATE todo
      SET ${fields.join(", ")}, updated = NOW()
      WHERE id = ?
      `,
      [...values, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update todo" });
  }
});


app.delete("/api/todos/:id", async (req, res) => {
  const { team_id, user_id } = req.body;

  try {
    const db = getDb();

    const [result] = await db.query(
      `
      DELETE t
      FROM todo t
      JOIN team_members tm
        ON t.team_id = tm.team_id
      WHERE t.id = ?
        AND t.team_id = ?
        AND tm.user_id = ?
      `,
      [req.params.id, team_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found in this team" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete todo" });
  }
});


// --------------------
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
