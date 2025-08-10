import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authroutes.js';
import formRoutes from './routes/fromroutes.js';
import uploadRoutes from './routes/uploadoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// connect DB
connectDB();

// middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/forms', formRoutes);

// health
app.get('/', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));



// start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
