import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js'; 
import runRoutes from './routes/runRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(cors()); 
app.use(express.json()); 

// Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection failed:', err.message));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/run', runRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send({ status: 'ok', service: 'AlgoSaathi API' });
});

app.get('/db-ping', async (req, res) => {
  try {
    await mongoose.connection.db.command({ ping: 1 });
    return res.status(200).json({ message: 'Database pinged successfully' });
  } catch (err) {
    console.error('Ping error:', err.message);
    return res.status(500).json({ message: 'Database ping failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AlgoSaathi Server running on http://localhost:${PORT}`);
});
