import app from './app';
import { connectDB } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Start listening
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`📚 Swagger docs available at http://localhost:${env.PORT}/api-docs`);
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err: any) => {
      logger.error(`❌ Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: any) => {
      logger.error(`❌ Uncaught Exception: ${err.message}`);
      process.exit(1);
    });

  } catch (error) {
    logger.error(`❌ Initialization Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

startServer();
