require("dotenv").config();
const express = require("express");
const cors = require("cors");
import mongoose from "mongoose";
const { MongoClient } = require("mongodb");
import multer from "multer";
import path from "path";
require("mongodb");
const morgan = require("morgan");
import fs from "fs";


const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Logging middleware

// 🔹 Global DB Variable (Initialized Later)
let db: any; // Allow reassignment


async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  const client = new MongoClient(process.env.MONGO_URI,{serverSelectionTimeoutMS: 10000,});
  await client.connect();
  db = client.db("assignment-blog-site");
  console.log("✅ Database connected!");
}
// 📌 Call connectDB() when the server starts
connectDB();

// File upload setup
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: (arg0: null, arg1: string) => any) => cb(null, "uploads/"),
  filename: (req: any, file: { originalname: any; }, cb: (arg0: null, arg1: any) => any) => cb(null, Date.now() + path.extname(file.originalname)),
});


const upload = multer({ dest: 'uploads/' });
// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


// ✅ Sample Route (Basic)
app.get("/", (req: any, res: { send: (arg0: string) => void; }) => {
  res.send("API is running...");
});

// Post schema for MongoDB using Mongoose
const postSchema = new mongoose.Schema({
  author: { type: String, required: true },
  title: { type: String, required: true },
  publishedDate: { type: Date, required: true },
  category: { type: String, required: true },
  likes: { type: Number, required: false},
  views: { type: Number, required: false},
  subcategory: { type: [String], required: false },
  summary: { type: String, required: true },
  tags: { type: [String], required: false }, // Add tags here
  description: { type: String, required: true },
  images: { type: [String], required: false },
});


const Post = mongoose.model("Post", postSchema);

// ✅ GET Posts 
app.get("/posts", async (req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; error?: unknown; }): void; new(): any; }; }; }) => {
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




// POST new Post with image uploads
app.post("/posts", upload.array("images", 10), async (req: { body: { author: any; title: any; publishedDate: any; category: any; subcategory: any; likes: any; views: any; summary: any; tags: any; description: any; }; files: any[]; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; post?: mongoose.Document<unknown, {}, { author: string; title: string; publishedDate: NativeDate; category: string; summary: string; description: string; likes?: number | null | undefined; views?: number | null | undefined; subcategory?: string[] | null | undefined; tags?: string[] | null | undefined; images?: string[] | null | undefined; }> & { author: string; title: string; publishedDate: NativeDate; category: string; summary: string; description: string; likes?: number | null | undefined; views?: number | null | undefined; subcategory?: string[] | null | undefined; tags?: string[] | null | undefined; images?: string[] | null | undefined; } & { _id: mongoose.Types.ObjectId; } & { __v: number; }; error?: unknown; }): void; new(): any; }; }; }) => {
  console.log("Request Body:", req.body);
  console.log("Uploaded Files:", req.files);
  
  try {
    // ✅ Check if DB is connected (1 = connected)
    console.log("🔍 Mongoose Connection ReadyState:", mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise(); // Wait until it's connected
    }

    // ✅ Parse request body properly
    const { author, title, publishedDate, category, subcategory, likes, views, summary, tags, description } = req.body;
    const parsedSubcategory = Array.isArray(subcategory) ? subcategory : JSON.parse(subcategory || "[]");
    const parsedTags = tags && tags !== "undefined" ? tags.split(",") : [];
    const imagePaths = req.files ? req.files.map((file: { path: any; }) => file.path) : [];

    const newPost = new Post({
      author,
      title,
      publishedDate,
      category,
      subcategory: parsedSubcategory,
      summary,
      likes,
      views,
      tags: parsedTags,
      description,
      images: imagePaths,
    });

    await newPost.save();
    res.status(201).json({ message: "Post created successfully!", post: newPost });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ message: "Server error", error });
  }
});





// Start Express server
app.listen(5000, () => console.log("Server running on port 5000"));
