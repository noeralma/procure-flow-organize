import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const port = 3001;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());

// Basic routes
app.get('/', (_req, res) => {
  res.json({
    message: 'Simple Procurement Flow API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Simple server is running on port ${port}`);
  logger.info(`🌐 API Base URL: http://localhost:${port}`);
  logger.info(`🏥 Health Check: http://localhost:${port}/health`);
});