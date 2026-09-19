import "dotenv/config";
import { connectDB } from "./config/db.js";

async function testConnection() {
  try {
    await connectDB();
    console.log("🎉 Database connection test passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection test failed.");
    process.exit(1);
  }
}

testConnection();