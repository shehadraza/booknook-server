import "dotenv/config";
import dns from "node:dns";
import { MongoClient } from "mongodb";

// Use Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const client = new MongoClient(process.env.MONGODB_URI);

async function testConnection() {
  try {
    await client.connect();

    const db = client.db("booknook");
    await db.command({ ping: 1 });

    console.log("MongoDB Connected Successfully!");
    console.log("Database: booknook");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
  } finally {
    await client.close();
  }
}

testConnection();