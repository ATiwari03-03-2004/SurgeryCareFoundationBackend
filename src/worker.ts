import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startQueue, stopQueue } from './jobs/queue';
import { registerEmailHandlers } from './jobs/email/email-handler';

async function main() {
  await connectDatabase();
  const boss = await startQueue();

  registerEmailHandlers(boss);

  logger.info('Worker started and listening for jobs');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Worker received shutdown signal');
    await stopQueue();
    await disconnectDatabase();
    logger.info('Worker shut down gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Worker failed to start');
  process.exit(1);
});
