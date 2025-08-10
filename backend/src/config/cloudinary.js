import cloudinary from 'cloudinary';

const cfg = {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
};

if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
  console.warn('Cloudinary not fully configured. Uploads will fail until .env is set.');
}

cloudinary.v2.config(cfg);

export default cloudinary.v2;
