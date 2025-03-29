import mongoose, { Document, Schema } from 'mongoose';

interface IPost extends Document {
  title: string;
  content: string;
  createdAt: Date;
}

const PostSchema = new Schema<IPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

const Post = mongoose.model<IPost>('Post', PostSchema);

export default Post;
