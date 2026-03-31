import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Import error handling middleware
import { errorHandler, notFoundHandler } from './shared/errors';
import { ApiResponseBuilder, API_VERSION } from './shared/response';

// Import routes from new module structure
import templateRoutes from './modules/template/template.routes';

// Import legacy routes (to be refactored)
import scrapeRoutes from './routes/scrape.routes';
import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import audienceRoutes from './routes/audience.routes';
import subscriberRoutes from './routes/subscriber.routes';
import tagRoutes from './routes/tag.routes';
import dashboardRoutes from './routes/dashboard.routes';
import analyticsRoutes from './routes/analytics.routes';
import settingsRoutes from './routes/settings.routes';
import userManagementRoutes from './routes/userManagement.routes';
import auditLogRoutes from './routes/auditLog.routes';
import smsRoutes from "./routes/sms.routes";

dotenv.config();

const app = express();

// ============================================
// Middleware
// ============================================

app.use(
  cors({
    origin: [
      'http://187.77.185.7',
      'http://187.77.185.7:3000',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Request ID middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  (req.headers as any)['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// ============================================
// API Routes
// ============================================

app.use('/api/v1', scrapeRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/templates', templateRoutes); // New module structure
app.use('/api/v1/audiences', audienceRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use("/api/v1/sms", smsRoutes);

// ============================================
// Health Check
// Time Complexity: O(1)
// ============================================

app.get('/', (req, res) => {
  ApiResponseBuilder.success(res, {
    env: process.env.NODE_ENV || 'dev'
  }, 200, 'Email Marketing API is running');
});

// ============================================
// API Documentation Endpoint
// Time Complexity: O(1)
// ============================================

app.get('/api', (req, res) => {
  ApiResponseBuilder.success(res, {
    message: 'Email Marketing API',
    version: API_VERSION,
    endpoints: {
      auth: '/api/v1/auth',
      campaigns: '/api/v1/campaigns',
      templates: '/api/v1/templates',
      audiences: '/api/v1/audiences',
      subscribers: '/api/subscribers',
      tags: '/api/tags',
      dashboard: '/api/dashboard',
      analytics: '/api/analytics',
      settings: '/api/settings',
      users: '/api/users',
      auditLogs: '/api/audit-logs'
    }
  }, 200, 'API Documentation');
});

// ============================================
// Error Handling Middleware
// Must be after all routes
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
