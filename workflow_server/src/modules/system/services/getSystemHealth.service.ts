import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';

export interface SystemHealthResult {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  uptimeSeconds: number;
  memoryUsageMb: number;
  database: {
    globalDb: { status: 'CONNECTED' | 'ERROR'; userCount?: number };
    workspaceDb: { status: 'CONNECTED' | 'ERROR'; projectCount?: number };
  };
  timestamp: string;
}

export const getSystemHealthService = async (): Promise<SystemHealthResult> => {
  const uptimeSeconds = Math.floor(process.uptime());
  const memoryUsageMb = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;

  let globalDbStatus: 'CONNECTED' | 'ERROR' = 'CONNECTED';
  let userCount = 0;
  try {
    userCount = await globalPrisma.user.count();
  } catch (err) {
    globalDbStatus = 'ERROR';
  }

  let workspaceDbStatus: 'CONNECTED' | 'ERROR' = 'CONNECTED';
  let projectCount = 0;
  try {
    projectCount = await prisma.project.count();
  } catch (err) {
    workspaceDbStatus = 'ERROR';
  }

  const isHealthy = globalDbStatus === 'CONNECTED' && workspaceDbStatus === 'CONNECTED';

  return {
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    uptimeSeconds,
    memoryUsageMb,
    database: {
      globalDb: { status: globalDbStatus, userCount },
      workspaceDb: { status: workspaceDbStatus, projectCount },
    },
    timestamp: new Date().toISOString(),
  };
};
