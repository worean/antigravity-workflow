// -*- coding: utf-8 -*-
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '#lib/prisma.js';

/**
 * 🔒 보안 강화된 JWT 전용 인증 미들웨어
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      token = req.body?.token || req.body?.accessToken || req.body?.authToken || req.body?.auth?.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication token is required' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    let decoded: { userId: number; email: string } | null = null;

    try {
      decoded = jwt.verify(token, jwtSecret) as { userId: number; email: string };
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User associated with token not found' });
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', details: error.message });
  }
};

/**
 * 🔓 선택적 JWT 인증 미들웨어
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = req.body?.token || req.body?.accessToken || req.body?.auth?.token;

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
      try {
        const decoded = jwt.verify(token, jwtSecret) as { userId: number };
        if (decoded && decoded.userId) {
          const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
          if (user) req.user = user;
        }
      } catch {
        // 비로그인 허용
      }
    }
  } catch {
    // optional
  }
  next();
};

/**
 * 🛡️ 프로젝트 멤버십 검증 미들웨어
 */
export const requireProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized: Login required' });

    let projectId = Number(req.params.projectId || req.body.projectId || req.query.projectId);

    // URL의 :id 가 issueId 또는 projectId 로 들어올 수 있음
    const paramId = Number(req.params.id);
    if (!projectId && paramId) {
      // 먼저 이슈 검색
      const issue = await prisma.issue.findUnique({ where: { id: paramId }, select: { projectId: true } });
      if (issue) {
        projectId = issue.projectId;
      } else {
        // 이슈가 아니면 프로젝트 ID로 간주
        projectId = paramId;
      }
    }

    // 특정 대상 프로젝트/이슈가 지정되지 않은 전체 목록 조회의 경우 통과
    if (!projectId) {
      return next();
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId: currentUser.id } } }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.ownerId === currentUser.id;
    const isMember = project.members.length > 0;

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'Forbidden: Only members registered in this project can perform this action' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 👑 프로젝트 PM/Owner 전용 검증 미들웨어
 */
export const requireProjectPM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized: Login required' });

    let projectId = Number(req.params.projectId || req.body.projectId || req.query.projectId);

    const paramId = Number(req.params.id);
    if (!projectId && paramId) {
      const issue = await prisma.issue.findUnique({ where: { id: paramId }, select: { projectId: true } });
      if (issue) {
        projectId = issue.projectId;
      } else {
        projectId = paramId;
      }
    }

    if (!projectId) {
      return next();
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId: currentUser.id } } }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.ownerId === currentUser.id;
    const isPM = project.members.some((m) => m.role === 'ADMIN');

    if (!isOwner && !isPM) {
      return res.status(403).json({ error: 'Forbidden: Only Project Managers (PM / Owner) can perform this action' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ⚡ 시스템 전체 관리자(ADMIN) 권한 검증 미들웨어
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized: Login required' });

    if (currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: System Administrator (ADMIN) role required' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

