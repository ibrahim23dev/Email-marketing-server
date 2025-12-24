import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import scrapeRoutes from './routes/scrape.routes';
import authRoutes from './routes/auth.routes';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api', scrapeRoutes);
app.use('/api/auth', authRoutes);
console.log('APIFY_TOKEN =>', process.env.APIFY_TOKEN);


app.get('/', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev' });
});

export default app;
