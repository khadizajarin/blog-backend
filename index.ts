require("dotenv").config();
import express, { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoClient } from "mongodb"; // Import MongoClient
const morgan = require("morgan");

const app = express();


app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Logging middleware

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB Connected via Mongoose"))
  .catch(err => console.error(err));

// Connect to MongoDB Client and perform ping check
const mongoUri = process.env.MONGO_URI as string; // Your MongoDB URI
const client = new MongoClient(mongoUri);

const checkMongoConnection = async () => {
  try {
    //await client.connect();
    console.log("MongoDB Client Connected");

    // Ping the database to check connection
    //await client.db("admin").command({ ping: 1 });
    console.log("Ping successful");
    //await client.close(); // Close the client connection
  } catch (error) {
    console.error("MongoDB Client connection failed", error);
  }
};

checkMongoConnection(); // Call the function to perform the ping

// Post schema for MongoDB using Mongoose
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

export default async (req: Request, res: Response) => {
  if (req.method === 'GET') {
    try {
      // Example query to fetch posts
      const posts = await client.db("assignment-blog-site").collection("posts").find().toArray();
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts", error });
    }
  } else {
    res.status(404).json({ message: "Route not found" });
  }
};

// Test route
app.get("/", (req, res) => {
  res.send("Blog API is running!");
});

app.listen(5000, () => console.log("Server running on port 5000"));
