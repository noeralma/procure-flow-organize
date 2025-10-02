import express from 'express';
import cors from 'cors';

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
  console.log(`🚀 Simple server is running on port ${port}`);
  console.log(`🌐 API Base URL: http://localhost:${port}`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
});