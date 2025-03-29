// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "./cloudinaryConfig";

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "blog-uploads", // Change this as needed
//     allowed_formats: ["jpg", "png", "jpeg", "webp"],
//   },
// });

// const upload = multer({ storage });

// export default upload;


import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinaryConfig"; // Ensure this path is correct

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: "blog-uploads", // Your folder name
    format: file.mimetype.split("/")[1], // Extracts file extension
    public_id: file.originalname.split(".")[0], // Removes extension from file name
  }),
});

const upload = multer({ storage });

export default upload;
