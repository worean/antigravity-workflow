import { Request, Response } from 'express';
import { getSystemHealthService } from './services/getSystemHealth.service.js';
import { getSystemVersionService } from './services/getSystemVersion.service.js';

export const getSystemHealthController = async (req: Request, res: Response) => {
  try {
    const health = await getSystemHealthService();
    res.status(200).json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message || '시스템 상태 조회에 실패했습니다.' });
  }
};

export const getSystemVersionController = async (req: Request, res: Response) => {
  try {
    const version = await getSystemVersionService();
    res.status(200).json(version);
  } catch (err: any) {
    res.status(500).json({ error: err.message || '시스템 버전 조회에 실패했습니다.' });
  }
};
