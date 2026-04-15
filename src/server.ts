import app from './app';
import { DatabaseManager } from './infrastructure/database';
import logger from './utils/logger';
import { startEmailWorker } from './queues/email.queue.js';

// ============================================
// Server Configuration
// ============================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// Start Server
// Time Complexity: O(log n) for database connection
// ============================================

async function startServer(): Promise<void> {
  try {
    await DatabaseManager.connect();
    logger.info('Database connected successfully');

    startEmailWorker();
    logger.info('Email worker started');

    const server = app.listen(PORT, () => {
      logger.info(`========================================`);
      logger.info(`🚀 Server running in ${NODE_ENV} mode`);
      logger.info(`📡 Listening on port ${PORT}`);
      logger.info(`🌐 API Base: http://localhost:${PORT}/api/v1`);
      logger.info(`========================================`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await DatabaseManager.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
