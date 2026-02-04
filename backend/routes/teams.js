// routes/teams.js
const express = require("express");
const router = express.Router();
const { getDb } = require("../db");


// Create team
router.post("/", async (req, res) => {
  const { name, admin_user_id } = req.body;

  if (!name || !admin_user_id) {
    return res.status(400).json({ message: "name and admin_user_id required" });
  }

  try {
    const db = getDb();

    // 1️⃣ Create team
    const [teamResult] = await db.query(
      "INSERT INTO teams (name, admin_user_id) VALUES (?, ?)",
      [name, admin_user_id]
    );

    const teamId = teamResult.insertId;

    // 2️⃣ Add admin to team_members
    await db.query(
      "INSERT INTO team_members (team_id, user_id) VALUES (?, ?)",
      [teamId, admin_user_id]
    );

    res.status(201).json({
      id: teamId,
      name,
      admin_user_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create team" });
  }
});


// Add member (Admin only)
router.post("/:teamId/members", async (req, res) => {
  const { teamId } = req.params;
  const { admin_user_id, user_id } = req.body;

  if (!admin_user_id || !user_id) {
    return res.status(400).json({ message: "admin_user_id and user_id required" });
  }

  try {
    const db = getDb();

    // 🔐 Check admin
    const [[team]] = await db.query(
      "SELECT * FROM teams WHERE id = ? AND admin_user_id = ?",
      [teamId, admin_user_id]
    );

    if (!team) {
      return res.status(403).json({ message: "Not team admin" });
    }

    // ➕ Add member
    await db.query(
      "INSERT INTO team_members (team_id, user_id) VALUES (?, ?)",
      [teamId, user_id]
    );

    res.json({ message: "User added to team" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add member" });
  }
});

// Get team members
router.get("/:teamId/members", async (req, res) => {
  const { teamId } = req.params;

  try {
    const db = getDb();

    const [members] = await db.query(`
      SELECT 
        u.id AS user_id,
        u.username,
        u.full_name,
        u.profile_image
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
    `, [teamId]);

    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
});


router.delete("/:teamId/members/:userId", async (req, res) => {
  console.log("🔥 DELETE MEMBER HIT");

  try {
    const db = getDb(); // ✅ get DB HERE

    const { teamId, userId } = req.params;
    const { admin_user_id } = req.body;

    if (!admin_user_id || !userId) {
      return res
        .status(400)
        .json({ message: "admin_user_id and user_id required" });
    }

    // verify admin
    const [teams] = await db.query(
      "SELECT id FROM teams WHERE id = ? AND admin_user_id = ?",
      [teamId, admin_user_id]
    );

    if (teams.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (Number(userId) === Number(admin_user_id)) {
      return res
        .status(400)
        .json({ message: "Admin cannot remove themself" });
    }

    await db.query(
      "DELETE FROM team_members WHERE team_id = ? AND user_id = ?",
      [teamId, userId]
    );

    res.json({ message: "Member removed" });

  } catch (err) {
    console.error("❌ REMOVE MEMBER ERROR STACK:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/", async (req, res) => {
  const { user_id } = req.query;

  const db = getDb();

  const [teams] = await db.query(`
    SELECT t.*
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ?
  `, [user_id]);

  res.json(teams);
});

// ❌ Delete team (Admin only)
router.delete("/:teamId", async (req, res) => {
  const { teamId } = req.params;
  const { admin_user_id } = req.body;

  if (!admin_user_id) {
    return res.status(400).json({ message: "admin_user_id required" });
  }

  try {
    const db = getDb();

    // 🔐 Verify admin
    const [[team]] = await db.query(
      "SELECT id FROM teams WHERE id = ? AND admin_user_id = ?",
      [teamId, admin_user_id]
    );

    if (!team) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🧹 Delete team todos
    await db.query("DELETE FROM todo WHERE team_id = ?", [teamId]);

    // 🧹 Delete team members
    await db.query("DELETE FROM team_members WHERE team_id = ?", [teamId]);

    // 🧹 Delete team
    await db.query("DELETE FROM teams WHERE id = ?", [teamId]);

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Delete team error:", err);
    res.status(500).json({ message: "Failed to delete team" });
  }
});


module.exports = router;