import cloudinary from 'cloudinary';
import dotenv from "dotenv"
dotenv.config();
const cfg = {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
};

if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
  console.warn('Cloudinary not fully configured. Uploads will fail until .env is set.');
}

cloudinary.v2.config(cfg);

export default cloudinary.v2;
