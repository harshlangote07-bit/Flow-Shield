import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Area from "../models/Area.js";

dotenv.config();

const createOfficialUser = async () => {
  try {
    await connectDB();

    const email = "official@flowshield.com";
    const password = "Official@123";

    const area = await Area.findOne({ areaId: "AREA_TEST_001" });

    if (!area) {
      throw new Error("AREA_TEST_001 was not found in the database");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Official user already exists.");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      userId: "OFFICIAL_001",
      name: "Flow Shield Official",
      email,
      passwordHash,
      role: "official",
      department: "Flood Management",
      assignedAreas: [area._id],
      isActive: true
    });

    console.log("Official user created successfully.");
    console.log("Email:", user.email);
    console.log("Password:", password);
    console.log("Role:", user.role);
    console.log("Assigned area:", area.areaId);

    process.exit(0);
  } catch (error) {
    console.error("Failed to create official user:", error.message);
    process.exit(1);
  }
};

createOfficialUser();