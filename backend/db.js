// backend/db.js
require("dotenv").config();
const mysql = require("mysql2/promise");

let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("✅ MySQL connected (promise mode)");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err);
    process.exit(1);
  }
})();

module.exports = {
  getDb: () => db
};
