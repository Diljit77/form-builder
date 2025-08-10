import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controller/uploadcontroller.js';

const router = express.Router();
const upload = multer(); // memory storage

// Single image upload, field name: image
router.post('/', upload.single('image'), uploadImage);

export default router;
