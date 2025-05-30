const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

const dbFolder = app.getPath("userData");
const dbPath = path.join(dbFolder, "app.db");

console.log("📂 Database path:", dbPath);

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "");
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error("❌ เปิด DB ไม่ได้:", err.message);
});

db.serialize(() => {
  // Create income_entries table
  db.run(`
    CREATE TABLE IF NOT EXISTS income_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      sell_price INTEGER NOT NULL
    )
  `);

  // Create/Update products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sell_price INTEGER NOT NULL 
      // Quantity will be added via ALTER TABLE if needed
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating products table (initial):", err.message);
      return;
    }
    
    // Check if 'quantity' column exists and add it if not
    db.all("PRAGMA table_info(products)", (pragmaErr, columns) => {
      if (pragmaErr) {
        console.error("❌ Error fetching products table info:", pragmaErr.message);
        return;
      }

      const quantityColumnExists = columns.some(col => col.name === 'quantity');
      if (!quantityColumnExists) {
        db.run("ALTER TABLE products ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0", (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding quantity column to products:", alterErr.message);
            return;
          }
          console.log("✅ 'quantity' column added to products table with default value 0.");
          // Mock data insertion should ideally be after potential schema alteration
          insertMockProducts(); 
        });
      } else {
        // If column already exists, proceed to insert mock data
        insertMockProducts();
      }
    });
  });

  // Create monthly_costs table
  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL UNIQUE,  -- เช่น "2025-05"
      cost_total INTEGER NOT NULL
    )
  `);

  function insertMockProducts() {
    db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
      if (err) {
        console.error("❌ Error counting products for mock data:", err.message);
        return;
      }
      console.log("🧮 Products count for mock data check:", row.count);
      // Ensure that we are checking if mock data for these specific items needs to be added,
      // or if the table is completely empty. The original check was if row.count === 0.
      // If the table might have other products but not these ones, this logic might need adjustment.
      // For simplicity, we'll stick to adding if the table is empty.
      if (row.count === 0) { 
        // Update mock data to include quantity
        db.run("INSERT INTO products (name, quantity, sell_price) VALUES (?, ?, ?)", ["โค้ก", 50, 25], (insertErr) => {
          if (insertErr) console.error("❌ Error inserting mock product 'โค้ก':", insertErr.message);
        });
        db.run("INSERT INTO products (name, quantity, sell_price) VALUES (?, ?, ?)", ["น้ำเปล่า", 100, 10], (insertErr) => {
          if (insertErr) console.error("❌ Error inserting mock product 'น้ำเปล่า':", insertErr.message);
          else console.log("🥤 Mock product data (with quantity) added/verified.");
        });
      } else {
        console.log("ℹ️ Products table not empty, mock data insertion skipped.");
      }
    });
  }
  console.log("✅ Tables setup process initiated."); // Changed log slightly
});

module.exports = db;
