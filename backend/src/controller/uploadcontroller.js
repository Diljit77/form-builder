import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';

// multer will place file buffer on req.file
export const uploadImage = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const stream = cloudinary.uploader.upload_stream({ folder: 'form-builder' }, (error, result) => {
      if (error) return next(error);
      res.json({ url: result.secure_url, public_id: result.public_id });
    });

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
   console.log(err)
   return res.status(500).json({ error: 'Server error' });
  }
};
