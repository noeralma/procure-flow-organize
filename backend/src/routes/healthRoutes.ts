import { Router, Request, Response } from 'express';
import os from 'os';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'ok' }, 'Health check');
});

router.get('/live', (_req: Request, res: Response) => {
  sendSuccess(res, { live: true }, 'Liveness check');
});

router.get('/ready', (_req: Request, res: Response) => {
  // A real readiness check would verify DB/connections
  sendSuccess(res, { ready: true }, 'Readiness check');
});

router.get('/metrics', (_req: Request, res: Response) => {
  sendSuccess(res, {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    loadavg: os.loadavg(),
  }, 'Basic metrics');
});

router.get('/version', (_req: Request, res: Response) => {
  sendSuccess(res, {
    node: process.version,
    app: process.env['npm_package_version'] || '1.0.0',
  }, 'Version info');
});

router.get('/detailed', (_req: Request, res: Response) => {
  sendSuccess(res, {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    platform: process.platform,
  }, 'Detailed health');
});

export default router;