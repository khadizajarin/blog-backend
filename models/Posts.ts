import mongoose, { Date, Document, Schema } from 'mongoose';

interface IPost extends Document {
  author: string;
  authorEmail: string;
  title: string;
  category: string;
  subcategory: string;
  likes:number;
  views:number;
  summary: string;
  description: string;
  images: string[];  // Array of strings to store image paths
  
}

const PostSchema = new Schema<IPost>({
  author: { type: String, required: true },
  authorEmail: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  subcategory: { type: String, required: true },
  summary: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: false }, 
},
 {
  timestamps: true, // This adds createdAt and updatedAt fields automatically
});

const Post = mongoose.model<IPost>('Post', PostSchema);

export default Post;
