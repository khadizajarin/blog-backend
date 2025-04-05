import mongoose, { Document, Schema } from 'mongoose';

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
  likes:{type: Number, required:true},
  views:{type: Number, required:true},
  subcategory: { type: String, required: true },// Optional array of subcategories
  summary: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: false },  // Optional array of image paths
});

const Post = mongoose.model<IPost>('Post', PostSchema);

export default Post;
