import 'dotenv/config';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

async function main() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, `Server running on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server shut down gracefully');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
