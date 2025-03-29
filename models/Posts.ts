import mongoose, { Document, Schema } from 'mongoose';

interface IPost extends Document {
  author: string;
  title: string;
  publishedDate: Date;
  category: string;
  likes:number;
  views:number;
  subcategory: string[];  // Array of strings for subcategories
  summary: string;
  tags: string[];  // Array of strings for tags
  description: string;
  images: string[];  // Array of strings to store image paths

}

const PostSchema = new Schema<IPost>({
  author: { type: String, required: true },
  title: { type: String, required: true },
  publishedDate: { type: Date, required: true },
  category: { type: String, required: true },
  likes:{type: Number, required:false},
  views:{type: Number, required:false},
  subcategory: { type: [String], required: false },  // Optional array of subcategories
  summary: { type: String, required: true },
  tags: { type: [String], required: false },  // Optional array of tags
  description: { type: String, required: true },
  images: { type: [String], required: false },  // Optional array of image paths
});

const Post = mongoose.model<IPost>('Post', PostSchema);

export default Post;
