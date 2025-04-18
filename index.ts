require("dotenv").config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import mongoose, { ConnectOptions } from "mongoose";
import multer, { FileFilterCallback } from "multer";
import morgan from "morgan";
import { v2 as cloudinary } from "cloudinary";
import Post from "./models/Posts";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// File upload setup
const storage = multer.memoryStorage();  // Using memory storage to upload files directly to Cloudinary

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for each file
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});


// MongoDB connection
async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    const options: ConnectOptions = {
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

//Update POSts
app.put("/posts/:id", upload.array("images", 10), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;  // Get the post ID from the URL
    const post = await Post.findById(id);
    //console.log("updating id", id, post);
    const { title, category, subcategory, summary, description } = req.body;

    // Handle the files (images)
    const imageUrls: string[] = [];
    
    if (req.files) {
      // Upload images to Cloudinary
      const uploadPromises = (req.files as Express.Multer.File[]).map((file) => {
        return new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "blog-posts" },
            (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result?.secure_url || "");
              }
            }
          );
          stream.end(file.buffer); // Upload file buffer directly to Cloudinary
        });
      });

      imageUrls.push(...await Promise.all(uploadPromises));  // All image URLs after upload
    }

    // Update post data, excluding id, author, and authorEmail
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        title,
        category,
        subcategory,
        summary,
        description,
        images: imageUrls.length > 0 ? imageUrls : undefined, // Only update images if new ones are provided
      },
      { new: true }  // Return the updated document
    );

    res.status(200).json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error("❌ Error updating post:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// DELETE post by ID
app.delete("/posts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;  // Get the post ID from the URL
    const post = await Post.findById(id);
    console.log("updating id", id, post);

    // Delete the images from Cloudinary (if any)
    if (post?.images && post.images.length > 0) {
      const deletePromises = post.images.map((imageUrl) => {
        const publicId = imageUrl.split("/").pop()?.split(".")[0]; // Extract the public ID from the URL
        return cloudinary.uploader.destroy(publicId || ""); // Destroy the image by public ID
      });

      // Wait for all image deletions to complete
      await Promise.all(deletePromises);
    }

    // Delete the post from the database
    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// POST new post with images
app.post("/posts", upload.array("images", 10), async (req: Request, res: Response): Promise<void> => {
  try {
    const { author, authorEmail, title, category, subcategory, summary, description } = req.body;

    // Set default likes and views to 0
    const likes = 0;
    const views = 0;

    // Handle the files
    const imageUrls: string[] = [];

    if (req.files) {
      // Upload images to Cloudinary
      const uploadPromises = (req.files as Express.Multer.File[]).map((file) => {
        return new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "blog-posts" },
            (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result?.secure_url || "");
              }
            }
          );
          stream.end(file.buffer); // Upload file buffer directly to Cloudinary
        });
      });

      imageUrls.push(...await Promise.all(uploadPromises));  // All image URLs after upload
    }

    const newPost = new Post({
      author,
      authorEmail,
      title,
      category,
      subcategory,
      summary,
      description,
      images: imageUrls, // Save image URLs
      likes,  // Set likes to 0 by default
      views,  // Set views to 0 by default
    });

    //console.log(newPost);

    await newPost.save();
    res.status(201).json({ message: "Post created successfully!", post: newPost });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Example using Express and MongoDB (Mongoose)
app.get('/posts/search', async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  
  
  try {
    const posts = await Post.find({
      $or: [
        { title: { $regex: q, $options: 'i' } }, // Case-insensitive match
        { author: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { subcategory: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
});




// Sample Route
app.get("/", (_req: Request, res: Response) => {
  res.send("API is running...");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
