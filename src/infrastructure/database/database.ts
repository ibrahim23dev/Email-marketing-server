import mongoose from 'mongoose';
import logger from '../../utils/logger';

// ============================================
// Database Configuration
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/email-marketing';

interface ConnectionOptions {
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
}

const DEFAULT_OPTIONS: ConnectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// ============================================
// Database Connection Manager
// Time Complexity: O(log n) for connection establishment
// ============================================

export class DatabaseManager {
  private static isConnected = false;

  /**
   * Connect to MongoDB
   * Time Complexity: O(log n) for connection establishment
   */
  static async connect(options: ConnectionOptions = {}): Promise<void> {
    if (this.isConnected) {
      logger.info('Using existing database connection');
      return;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: opts.maxPoolSize,
        serverSelectionTimeoutMS: opts.serverSelectionTimeoutMS,
        socketTimeoutMS: opts.socketTimeoutMS,
      });

      this.isConnected = true;
      logger.info('MongoDB connected successfully');

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   * Time Complexity: O(1)
   */
  static async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   * Time Complexity: O(1)
   */
  static isReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection instance
   * Time Complexity: O(1)
   */
  static getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}
