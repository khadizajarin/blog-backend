require("dotenv").config();
import express, { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

 

  //post schema
  const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    createdAt: { type: Date, default: Date.now },
  });
  
  const Post = mongoose.model("Post", postSchema);



  // Route to fetch all posts
  app.get("/posts", async (req: Request, res: Response) => {
    try {
      const posts = await Post.find(); // Fetch all posts from MongoDB
      res.json(posts); // Return posts as JSON
      console.log(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts", error });
    }
  });
  
  // Create post function for testing
  

app.get("/", (req, res) => {
  res.send("Blog API is running!");
});

app.listen(5000, () => console.log("Server running on port 5000"));
