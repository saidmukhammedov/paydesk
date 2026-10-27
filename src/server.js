const config = require('./config');
const { createApp } = require('./app');
const { getDatabase } = require('./db/database');
const { isPostgresConfigured, initPostgresSchema } = require('./db/postgres');

async function start() {
  if (isPostgresConfigured()) {
    console.log('[Database] Connecting to PostgreSQL (Vercel Postgres)...');
    await initPostgresSchema();
    console.log('[Database] PostgreSQL schema initialized.');
  } else {
    getDatabase();
    console.log(`[Database] Initialized SQLite at: ${config.DB_PATH}`);
  }

  const app = createApp();

  const server = app.listen(config.PORT, () => {
    console.log(`[Server] Learning Center running at http://localhost:${config.PORT}`);
  });

  function handleShutdown(signal) {
    console.log(`\n[Server] Received ${signal}. Closing server gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { start };
