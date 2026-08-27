// -*- coding: utf-8 -*-
import { Request, Response, NextFunction } from 'express';
import { toggleFavoriteService } from './services/toggleFavorite.service.js';
import { getFavoritesService } from './services/getFavorites.service.js';

export const toggleFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { targetType, targetId } = req.body;
    if (!targetType || !targetId) {
      res.status(400).json({ error: 'targetType과 targetId는 필수 입력 항목입니다.' });
      return;
    }

    const result = await toggleFavoriteService({
      userId,
      targetType,
      targetId: Number(targetId),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const targetType = req.query.targetType as string | undefined;

    const favorites = await getFavoritesService({
      userId,
      targetType,
    });

    res.json(favorites);
  } catch (error) {
    next(error);
  }
};