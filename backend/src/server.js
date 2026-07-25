import app from './app.js';
import env from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port} in ${env.nodeEnv} mode`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  server.close(() => process.exit(0));
});
