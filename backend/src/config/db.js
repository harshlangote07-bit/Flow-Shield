import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = "flood_risk_db";

if (!uri) {
  throw new Error("MONGODB_URI is missing in .env");
}

const client = new MongoClient(uri);

let db;

export async function connectDB() {
  try {
    await client.connect();

    db = client.db(dbName);

    console.log("✅ Backend connected to MongoDB");

    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error);
    throw error;
  }
}

export function getDB() {
  if (!db) {
    throw new Error("Database is not connected");
  }

  return db;
}