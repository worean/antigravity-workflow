export interface SystemVersionResult {
  name: string;
  version: string;
  nodeVersion: string;
  environment: string;
  timestamp: string;
}

export const getSystemVersionService = async (): Promise<SystemVersionResult> => {
  return {
    name: 'AntiGravity Workflow API',
    version: '2.5.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };
};
