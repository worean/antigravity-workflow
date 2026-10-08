import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('System Module Sub-Service & REST API Tests', () => {
  it('TC-POS-01: GET /api/system/health should return system status, uptime, and dual DB status', async () => {
    const res = await request(app).get('/api/system/health');

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.status).toMatch(/HEALTHY|DEGRADED/);
    expect(typeof res.body.uptimeSeconds).toBe('number');
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.memoryUsageMb).toBe('number');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.globalDb.status).toBe('CONNECTED');
    expect(res.body.database.workspaceDb.status).toBe('CONNECTED');
    expect(res.body.timestamp).toBeDefined();
  });

  it('TC-POS-02: GET /api/system/version should return app name, version, and node version', async () => {
    const res = await request(app).get('/api/system/version');

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.name).toBe('AntiGravity Workflow API');
    expect(res.body.version).toBe('2.5.0');
    expect(res.body.nodeVersion).toBeDefined();
    expect(res.body.environment).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('TC-NEG-01: POST /api/system/health should return 404 for unsupported method', async () => {
    const res = await request(app).post('/api/system/health').send({ test: true });

    expect(res.status).toBe(404);
  });
});
