import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import scrapeRoutes from './routes/scrape.routes';
import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import templateRoutes from './routes/template.routes';
import audienceRoutes from './routes/audience.routes';
import subscriberRoutes from './routes/subscriber.routes';
import tagRoutes from './routes/tag.routes';
import dashboardRoutes from './routes/dashboard.routes';
import analyticsRoutes from './routes/analytics.routes';
import settingsRoutes from './routes/settings.routes';
import userManagementRoutes from './routes/userManagement.routes';
import auditLogRoutes from './routes/auditLog.routes';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/audiences', audienceRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev', message: 'Email Marketing API' });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    ok: true,
    message: 'Email Marketing API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      campaigns: '/api/campaigns',
      templates: '/api/templates',
      audiences: '/api/audiences',
      subscribers: '/api/subscribers',
      tags: '/api/tags',
      dashboard: '/api/dashboard',
      analytics: '/api/analytics',
      settings: '/api/settings',
      users: '/api/users',
      auditLogs: '/api/audit-logs'
    }
  });
});

export default app;
