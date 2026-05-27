import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js'; 
import runRoutes from './routes/runRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import userRoutes from './routes/userRoutes.js';

const a = express();

a.use(cors()); 
a.use(express.json()); 

mongoose.connection.on('connected', () => console.log('c_ok'));
mongoose.connection.on('error', (e) => console.log('c_err', e));
mongoose.connection.on('disconnected', () => console.log('c_dc'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("db_ok"))
  .catch(e => console.error("db_f", e));

a.use('/api/auth', authRoutes);
a.use('/api/run', runRoutes);
a.use('/api/ai', aiRoutes);
a.use('/api/users', userRoutes);

a.get('/', (q, r) => {
  r.send('ok');
});

const p = process.env.PORT || 5000;
a.listen(p, () => {
  console.log(`p_${p}`);
});
