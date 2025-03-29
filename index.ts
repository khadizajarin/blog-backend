require("dotenv").config();
const express = require("express");
const cors = require("cors");
import mongoose from "mongoose";
const { MongoClient } = require("mongodb");
const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Logging middleware

// 🔹 Global DB Variable (Initialized Later)
let db: { collection: (arg0: string) => any; };

// ✅ Connect to MongoDB Once
async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGO_URI);
        //await client.connect();
        db = client.db("assignment-blog-site"); // Assign DB globally
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        //process.exit(1);
    }
}

// 📌 Call connectDB() when the server starts
connectDB();

// ✅ Sample Route (Basic)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Post schema for MongoDB using Mongoose
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

// ✅ GET Posts (Sorted by Latest Time)
app.get("/posts", async (req, res) => {
  try {
      if (!db) return res.status(500).json({ message: "Database not connected!" });

      const postsCollection = db.collection("posts");

      // Fetch posts sorted in descending order (latest first)
      const posts = await postsCollection.find().sort({ createdAt: -1 }).toArray();

      res.status(200).json(posts);
  } catch (error) {
      console.error("❌ Fetch Posts Error:", error);
      res.status(500).json({ message: "Server error", error });
  }
});



// Start Express server
app.listen(5000, () => console.log("Server running on port 5000"));
