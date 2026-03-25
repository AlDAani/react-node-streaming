import { createServerRuntime } from '@/infrastructure/runtime';

async function main(): Promise<void> {
  const runtime = createServerRuntime();
  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    const forcedExitTimer = setTimeout(() => {
      console.error(`Forced shutdown after ${runtime.config.shutdownGraceMs}ms (${signal}).`);
      process.exit(1);
    }, runtime.config.shutdownGraceMs);

    forcedExitTimer.unref();

    try {
      await runtime.close();
      clearTimeout(forcedExitTimer);
      process.exit(0);
    } catch (error) {
      clearTimeout(forcedExitTimer);
      console.error('Failed to shutdown presight-backend gracefully.');
      console.error(error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  try {
    await runtime.start();
    const address = runtime.server.address();
    const port = typeof address === 'object' && address ? address.port : runtime.config.port;
    console.log(`presight-backend listening on http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to start presight-backend');
    console.error(error);
    process.exit(1);
  }
}

void main();
