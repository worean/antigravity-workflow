// -*- coding: utf-8 -*-
import { Router } from 'express';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';
import * as favoritesController from './favorites.controller.js';

export const favoriteRouter = Router();

favoriteRouter.post('/toggle', requireAuth, favoritesController.toggleFavorite);
favoriteRouter.get('/', requireAuth, favoritesController.getFavorites);