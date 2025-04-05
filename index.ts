import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import mongoose, { ConnectOptions } from "mongoose";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import morgan from "morgan";

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// File upload setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Sample Route
app.get("/", (_req: Request, res: Response) => {
  res.send("API is running...");
});

// Post schema
const postSchema = new mongoose.Schema({
  author: { type: String, required: true },
  title: { type: String, required: true },
  publishedDate: { type: Date, required: true },
  category: { type: String, required: true },
  likes: { type: Number },
  views: { type: Number },
  subcategory: { type: [String] },
  summary: { type: String, required: true },
  tags: { type: [String] },
  description: { type: String, required: true },
  images: { type: [String] },
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

// MongoDB connection
async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    const options: ConnectOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    } as ConnectOptions;

    await mongoose.connect(mongoUri, options);
    console.log("✅ Database connected!");

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("❌ MongoDB disconnected");
    });
  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
}

connectDB();

// GET posts
app.get("/posts", async (_req: Request, res: Response) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("❌ Fetch Posts Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// POST new post with images
app.post("/posts", upload.array("images", 10), async (req: Request, res: Response) => {
  try {
    const { author, title, publishedDate, category, subcategory, likes, views, summary, tags, description } = req.body;

    const parsedSubcategory: string[] = typeof subcategory === "string" ? JSON.parse(subcategory) : subcategory;
    const parsedTags: string[] = typeof tags === "string" ? tags.split(",") : [];
    const imagePaths: string[] = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

    const newPost = new Post({
      author,
      title,
      publishedDate,
      category,
      summary,
      likes,
      views,
      description,
      subcategory: parsedSubcategory,
      tags: parsedTags,
      images: imagePaths,
    });

    await newPost.save();
    res.status(201).json({ message: "Post created successfully!", post: newPost });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
